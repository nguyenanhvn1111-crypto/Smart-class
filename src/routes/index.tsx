import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RoleGuard } from '../components/common/RoleGuard';

// Auth
import { LoginPage } from '../pages/auth/LoginPage';
import { UserProfilePage } from '../pages/common/UserProfilePage';

// Teacher
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { ClassList } from '../pages/teacher/ClassList';
import { ClassDetail } from '../pages/teacher/ClassDetail';
import { StudentList } from '../pages/teacher/StudentList';
import { StudentImportWizard } from '../pages/teacher/StudentImportWizard';
import { AttendancePage } from '../pages/teacher/AttendancePage';
import { AttendanceAnalyticsPage } from '../pages/teacher/AttendanceAnalyticsPage';
import { SchedulePage } from '../pages/teacher/SchedulePage';
import { AssignmentList } from '../pages/teacher/AssignmentList';
import { AssignmentCreate } from '../pages/teacher/AssignmentCreate';
import { AssignmentDetail } from '../pages/teacher/AssignmentDetail';
import { QuizPage } from '../pages/teacher/QuizPage';
import { QuizCreate } from '../pages/teacher/QuizCreate';
import { QuestionBankPage } from '../pages/teacher/QuestionBankPage';
import { ResourcesPage } from '../pages/teacher/ResourcesPage';
import { AutoGradingPage } from '../pages/teacher/AutoGradingPage';
import { AIAssistantPage } from '../pages/teacher/AIAssistantPage';
import { GradebookPage } from '../pages/teacher/GradebookPage';
import { BehaviorPage } from '../pages/teacher/BehaviorPage';
import { AlertsPage } from '../pages/teacher/AlertsPage';
import { ToolsHubPage } from '../pages/teacher/ToolsHubPage';
import { AnnouncementsPage } from '../pages/teacher/AnnouncementsPage';
import { ReportsPage } from '../pages/teacher/ReportsPage';
import { ModulesOverviewPage } from '../pages/teacher/ModulesOverviewPage';

// Student
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentAssignments } from '../pages/student/StudentAssignments';
import { StudentQuizTaker } from '../pages/student/StudentQuizTaker';
import { StudentGrades } from '../pages/student/StudentGrades';
import { StudentAttendance } from '../pages/student/StudentAttendance';
import { StudentRewards } from '../pages/student/StudentRewards';

// Parent
import { ParentDashboard } from '../pages/parent/ParentDashboard';
import { ParentMessages } from '../pages/parent/ParentMessages';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminAcademic } from '../pages/admin/AdminAcademic';
import { AdminAuditLogs } from '../pages/admin/AdminAuditLogs';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth */}
      <Route path="/login" element={<LoginPage initialMode="login" />} />
      <Route path="/register" element={<LoginPage initialMode="register" />} />

      {/* Main Layout Protected Area */}
      <Route element={<AppLayout />}>
        {/* Default redirect to teacher dashboard */}
        <Route path="/" element={<Navigate to="/teacher/dashboard" replace />} />

        {/* TEACHER ROUTES */}
        <Route
          path="/teacher/dashboard"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/modules"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ModulesOverviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ClassList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/classes/create"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ClassList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/classes/:id"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ClassDetail />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <StudentList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/students/create"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <StudentList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/students/import"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <StudentImportWizard />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/students/:id"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <StudentList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AttendancePage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/attendance/history"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AttendancePage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/attendance-analytics"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AttendanceAnalyticsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/schedule"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <SchedulePage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AssignmentList />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/assignments/create"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AssignmentCreate />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/assignments/:id"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AssignmentDetail />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/question-bank"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <QuestionBankPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <QuizPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/quizzes/create"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <QuizCreate />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/auto-grading"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AutoGradingPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/resources"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ResourcesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/ai"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AIAssistantPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/grades"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <GradebookPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/behavior"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <BehaviorPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/alerts"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AlertsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/tools"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ToolsHubPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/announcements"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AnnouncementsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/reports"
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <ReportsPage />
            </RoleGuard>
          }
        />
        <Route path="/teacher/profile" element={<UserProfilePage />} />
        <Route path="/teacher/settings" element={<UserProfilePage />} />

        {/* STUDENT ROUTES */}
        <Route
          path="/student/dashboard"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <SchedulePage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentAssignments />
            </RoleGuard>
          }
        />
        <Route
          path="/student/quizzes"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentQuizTaker />
            </RoleGuard>
          }
        />
        <Route
          path="/student/resources"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <ResourcesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/grades"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentGrades />
            </RoleGuard>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentAttendance />
            </RoleGuard>
          }
        />
        <Route
          path="/student/rewards"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <StudentRewards />
            </RoleGuard>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <RoleGuard allowedRoles={['student', 'admin']}>
              <AnnouncementsPage />
            </RoleGuard>
          }
        />
        <Route path="/student/profile" element={<UserProfilePage />} />
        <Route path="/student/settings" element={<UserProfilePage />} />

        {/* PARENT ROUTES */}
        <Route
          path="/parent/dashboard"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <ParentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/students"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <ParentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/grades"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <StudentGrades />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/attendance"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <StudentAttendance />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/schedule"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <SchedulePage />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/announcements"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <AnnouncementsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/parent/messages"
          element={
            <RoleGuard allowedRoles={['parent', 'admin']}>
              <ParentMessages />
            </RoleGuard>
          }
        />
        <Route path="/parent/profile" element={<UserProfilePage />} />
        <Route path="/parent/settings" element={<UserProfilePage />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/schools"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminAcademic />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/academic"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminAcademic />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminUsers />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <ClassList />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminUsers />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <ReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminAuditLogs />
            </RoleGuard>
          }
        />
        <Route path="/admin/profile" element={<UserProfilePage />} />
        <Route path="/admin/settings" element={<UserProfilePage />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
