import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize } from '@/theme';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type MenuAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type MenuOptions = {
  title?: string;
  actions: MenuAction[];
};

type AlertOptions = {
  title: string;
  message?: string;
  okLabel?: string;
};

type DialogState =
  | { kind: 'confirm'; options: ConfirmOptions }
  | { kind: 'menu'; options: MenuOptions }
  | { kind: 'alert'; options: AlertOptions };

type DialogApi = {
  /** Promise resolves `true` when confirmed, `false` when cancelled/dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Single-button notice — replaces native `Alert` (broken on web). */
  alert: (options: AlertOptions) => void;
  /** Action sheet — replaces native `Alert` button lists (which are broken on web). */
  menu: (options: MenuOptions) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  /**
   * Resolves an in-flight `confirm()` promise. Called on every state change so
   * a confirm that gets replaced or dismissed can never leave its promise
   * dangling forever.
   */
  const settlePending = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      settlePending(false);
      setState({ kind: 'confirm', options });
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [settlePending]
  );

  const menu = useCallback(
    (options: MenuOptions) => {
      settlePending(false);
      setState({ kind: 'menu', options });
    },
    [settlePending]
  );

  const alert = useCallback(
    (options: AlertOptions) => {
      settlePending(false);
      setState({ kind: 'alert', options });
    },
    [settlePending]
  );

  const resolveConfirm = useCallback(
    (result: boolean) => {
      settlePending(result);
      setState(null);
    },
    [settlePending]
  );

  const runAction = useCallback((action: MenuAction) => {
    setState(null);
    action.onPress();
  }, []);

  /** Dismiss without an explicit answer: a pending confirm resolves `false`. */
  const close = useCallback(() => {
    settlePending(false);
    setState(null);
  }, [settlePending]);

  return (
    <DialogContext.Provider value={{ confirm, alert, menu }}>
      {children}
      <Modal visible={!!state} onClose={close} title={state?.options.title}>
        {state?.kind === 'confirm' && (
          <>
            {state.options.message ? (
              <Text style={styles.message}>{state.options.message}</Text>
            ) : null}
            <View style={styles.row}>
              <Button
                label={state.options.cancelLabel ?? 'Cancelar'}
                variant="secondary"
                onPress={() => resolveConfirm(false)}
                style={styles.grow}
              />
              <Button
                label={state.options.confirmLabel ?? 'Confirmar'}
                variant={state.options.destructive ? 'danger' : 'primary'}
                onPress={() => resolveConfirm(true)}
                style={styles.grow}
              />
            </View>
          </>
        )}

        {state?.kind === 'alert' && (
          <>
            {state.options.message ? (
              <Text style={styles.message}>{state.options.message}</Text>
            ) : null}
            <Button
              label={state.options.okLabel ?? 'OK'}
              variant="primary"
              onPress={close}
            />
          </>
        )}

        {state?.kind === 'menu' && (
          <View style={styles.stack}>
            {state.options.actions.map((action) => (
              <Button
                key={action.label}
                label={action.label}
                variant={action.destructive ? 'danger' : 'primary'}
                onPress={() => runAction(action)}
              />
            ))}
            <Button label="Cancelar" variant="secondary" onPress={close} />
          </View>
        )}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  message: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  grow: { flex: 1 },
  stack: { gap: spacing.sm },
});
