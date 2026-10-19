import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PixelIcon } from './PixelIcon';
import { colors, spacing, fontSize } from '@/theme';
import { Modal } from './Modal';
import { Button } from './Button';
import { DialogButtons } from './DialogButtons';

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
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => void;
  menu: (options: MenuOptions) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

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
            <DialogMessage text={state.options.message} icon="question" />
            <DialogButtons
              confirmLabel={state.options.confirmLabel ?? 'OK'}
              cancelLabel={state.options.cancelLabel}
              destructive={state.options.destructive}
              onConfirm={() => resolveConfirm(true)}
              onCancel={() => resolveConfirm(false)}
            />
          </>
        )}

        {state?.kind === 'alert' && (
          <>
            <DialogMessage text={state.options.message} icon="info" />
            <View style={styles.right}>
              <Button label={state.options.okLabel ?? 'OK'} onPress={close} />
            </View>
          </>
        )}

        {state?.kind === 'menu' && (
          <View style={styles.stack}>
            {state.options.actions.map((action) => (
              <Button
                key={action.label}
                label={action.label}
                variant={action.destructive ? 'danger' : 'secondary'}
                onPress={() => runAction(action)}
              />
            ))}
            <Button label="Cancelar" variant="secondary" onPress={close} style={styles.cancel} />
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

function DialogMessage({ text, icon }: { text?: string; icon: 'question' | 'info' }) {
  if (!text) return null;
  return (
    <View style={styles.messageRow}>
      <PixelIcon
        name={icon === 'question' ? 'question-circle' : 'info-circle'}
        size={32}
        color={colors.primary}
      />
      <Text style={styles.message}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  message: { flex: 1, color: colors.textPrimary, fontSize: fontSize.sm },
  right: { flexDirection: 'row', justifyContent: 'flex-end' },
  stack: { gap: spacing.sm },
  cancel: { marginTop: spacing.xs },
});
