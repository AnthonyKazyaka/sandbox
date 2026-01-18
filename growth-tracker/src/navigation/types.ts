// Navigation type definitions
export type RootStackParamList = {
  Main: undefined;
  GoalDetail: { goalId: string };
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
