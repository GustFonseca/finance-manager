import * as ui from '..';

describe('UI kit entry point', () => {
  it('exposes every component', () => {
    expect(Object.keys(ui).sort()).toEqual(
      [
        'BarTrack',
        'Button',
        'CATEGORY_COLORS',
        'Card',
        'ChartLegend',
        'Checkbox',
        'ColorPicker',
        'ColumnChart',
        'DialogButtons',
        'DateInput',
        'DialogProvider',
        'EmptyState',
        'ErrorState',
        'FormError',
        'Input',
        'ListItem',
        'Modal',
        'MoneyText',
        'MonthSelect',
        'ProgressBar',
        'RadioGroup',
        'Select',
        'StackedBar',
        'StatTile',
        'UserAvatar',
        'YearSelect',
        'useDialog',
      ].sort()
    );
  });
});
