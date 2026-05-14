import { BASE_URL } from "./adminAuth";

type ApiFailure = {
  success: false;
  error: string;
};

export type ReportsPayload = {
  overview: {
    totalSessions: number;
    totalStudents: number;
    totalAnswers: number;
    correctAnswers: number;
    overallAccuracy: number;
  };
  questionAccuracy: Array<{
    id: number;
    label: string;
    sessionTitle: string;
    questionText: string;
    attempts: number;
    accuracy: number;
  }>;
  sessions: Array<{
    id: number;
    name: string;
    code: string;
    date: string | null;
    participants: number;
    avgAccuracy: number;
    status: string;
  }>;
};

type ReportsResponse =
  | {
      success: true;
      reports: ReportsPayload;
    }
  | ApiFailure;

export async function getAdminReports() {
  const res = await fetch(BASE_URL + "get_reports.php", {
    method: "GET",
    credentials: "include",
  });

  const data = (await res.json()) as ReportsResponse;
  if (!res.ok || !data.success) {
    throw new Error(data.success ? "Failed to load reports" : data.error);
  }

  return data.reports;
}
