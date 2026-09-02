import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

import RitualStepsListPage from './pages/ritualSteps/RitualStepsListPage';
import RitualStepFormPage from './pages/ritualSteps/RitualStepFormPage';

import DuasListPage from './pages/duas/DuasListPage';
import DuaFormPage from './pages/duas/DuaFormPage';

import GuideTopicsListPage from './pages/guideTopics/GuideTopicsListPage';
import GuideTopicFormPage from './pages/guideTopics/GuideTopicFormPage';

import TawafDuasListPage from './pages/verses/TawafDuasListPage';
import TawafDuaFormPage from './pages/verses/TawafDuaFormPage';
import SaiDuasListPage from './pages/verses/SaiDuasListPage';
import SaiDuaFormPage from './pages/verses/SaiDuaFormPage';

import ChecklistTemplateListPage from './pages/checklist/ChecklistTemplateListPage';
import ChecklistTemplateFormPage from './pages/checklist/ChecklistTemplateFormPage';

import EmergencyContactsListPage from './pages/emergencyContacts/EmergencyContactsListPage';
import EmergencyContactFormPage from './pages/emergencyContacts/EmergencyContactFormPage';

import FaqsListPage from './pages/faq/FaqsListPage';
import FaqFormPage from './pages/faq/FaqFormPage';

import AudioLibraryPage from './pages/audio/AudioLibraryPage';
import AudioFormPage from './pages/audio/AudioFormPage';

import CategoriesListPage from './pages/categories/CategoriesListPage';
import CategoryFormPage from './pages/categories/CategoryFormPage';

import AppSettingsPage from './pages/settings/AppSettingsPage';
import ForceUpdatePage from './pages/settings/ForceUpdatePage';

import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';

import AdminsPage from './pages/admins/AdminsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />

          <Route path="ritual-steps" element={<RitualStepsListPage />} />
          <Route path="ritual-steps/new" element={<RitualStepFormPage />} />
          <Route path="ritual-steps/:id" element={<RitualStepFormPage />} />

          <Route path="duas" element={<DuasListPage />} />
          <Route path="duas/new" element={<DuaFormPage />} />
          <Route path="duas/:id" element={<DuaFormPage />} />

          <Route path="guide-topics" element={<GuideTopicsListPage />} />
          <Route path="guide-topics/new" element={<GuideTopicFormPage />} />
          <Route path="guide-topics/:id" element={<GuideTopicFormPage />} />

          <Route path="tawaf-duas" element={<TawafDuasListPage />} />
          <Route path="tawaf-duas/new" element={<TawafDuaFormPage />} />
          <Route path="tawaf-duas/:id" element={<TawafDuaFormPage />} />

          <Route path="sai-duas" element={<SaiDuasListPage />} />
          <Route path="sai-duas/new" element={<SaiDuaFormPage />} />
          <Route path="sai-duas/:id" element={<SaiDuaFormPage />} />

          <Route path="checklist-template" element={<ChecklistTemplateListPage />} />
          <Route path="checklist-template/new" element={<ChecklistTemplateFormPage />} />
          <Route path="checklist-template/:id" element={<ChecklistTemplateFormPage />} />

          <Route path="faqs" element={<FaqsListPage />} />
          <Route path="faqs/new" element={<FaqFormPage />} />
          <Route path="faqs/:id" element={<FaqFormPage />} />

          <Route path="emergency-contacts" element={<EmergencyContactsListPage />} />
          <Route path="emergency-contacts/new" element={<EmergencyContactFormPage />} />
          <Route path="emergency-contacts/:id" element={<EmergencyContactFormPage />} />

          <Route path="audio" element={<AudioLibraryPage />} />
          <Route path="audio/new" element={<AudioFormPage />} />
          <Route path="audio/:id" element={<AudioFormPage />} />

          <Route path="categories" element={<CategoriesListPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:id" element={<CategoryFormPage />} />

          <Route path="settings" element={<AppSettingsPage />} />
          <Route path="force-update" element={<ForceUpdatePage />} />

          <Route path="users" element={<UsersListPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />

          <Route element={<ProtectedRoute superadminOnly />}>
            <Route path="admins" element={<AdminsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
