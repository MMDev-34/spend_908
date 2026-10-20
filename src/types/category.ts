export type CategoryType = "expense" | "income" | "both";

export interface Category {
  id: string;
  userId?: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}
