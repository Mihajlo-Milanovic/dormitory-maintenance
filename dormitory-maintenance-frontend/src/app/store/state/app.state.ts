import { AuthState, initialAuthState } from '@store/state/auth.state';
import { initialStudentReportState, StudentReportState } from '@store/state/student-report.state';
import { initialJanitorState, JanitorState } from '@store/state/janitor.state';

export interface AppState {
  auth: AuthState;
  studentReport: StudentReportState;
  janitor: JanitorState;
}

export const initialState: AppState = {
  auth: initialAuthState,
  studentReport: initialStudentReportState,
  janitor: initialJanitorState,
};
