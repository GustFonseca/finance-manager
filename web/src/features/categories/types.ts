export type CategoryType = 'INCOME' | 'EXPENSE';

export type CategoryDto = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
};

export type CategoryInput = {
  name: string;
  type: CategoryType;
  color: string;
};
