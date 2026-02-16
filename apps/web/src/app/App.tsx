import { NavLink, Route, Routes } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { StudyPage } from "../pages/StudyPage";
import { LearnPage } from "../pages/LearnPage";
import { WorkflowPage } from "../pages/WorkflowPage";
import { ExamPage } from "../pages/ExamPage";

export function App() {
  return (
    <div className="layout">
      <nav className="nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/study">Study</NavLink>
        <NavLink to="/learn">Learn</NavLink>
        <NavLink to="/workflow">Workflow</NavLink>
        <NavLink to="/exam">Exam</NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/exam" element={<ExamPage />} />
        </Routes>
      </main>
    </div>
  );
}
