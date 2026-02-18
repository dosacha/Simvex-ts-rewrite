// App.js
import { useState } from "react";
import SimvexLanding from "./Simvexlanding";
import StudyPage from "./Studypage";
import ProductListPage from "./Productlistpage";
import LearnPage from "./Learnpage";
import WorkflowPage from "./Workflowpage";
import ExamPage from "./Exampage";
import ExamFieldSelectPage from "./Examfieldselectpage";
import ExamProductSelectPage from "./Examproductselectpage";

export default function App() {
  const [page, setPage] = useState("landing");
  const [selectedField, setSelectedField] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [examField, setExamField] = useState(null); // 시험 분야
  const [examModels, setExamModels] = useState([]); // 시험 모델들 (배열)

  // Test 페이지 (모의고사)
  if (page === "exam") {
    return (
      <ExamPage
        field={examField}
        selectedModels={examModels}
        onHome={() => setPage("landing")}
        onStudy={() => setPage("study")}
        onLab={() => setPage("workflow")}
        onTest={() => setPage("examFieldSelect")}
        onBack={() => setPage("examProductSelect")}
      />
    );
  }

  // 시험 모델 선택 페이지
  if (page === "examProductSelect") {
    return (
      <ExamProductSelectPage
        field={examField}
        onHome={() => setPage("landing")}
        onBack={() => setPage("examFieldSelect")}
        onProductSelect={(field, models) => {
          setExamField(field);
          setExamModels(models);
          setPage("exam");
        }}
      />
    );
  }

  // 시험 분야 선택 페이지
  if (page === "examFieldSelect") {
    return (
      <ExamFieldSelectPage
        onHome={() => setPage("landing")}
        onStudy={() => setPage("study")}
        onLab={() => setPage("workflow")}
        onTest={() => setPage("examFieldSelect")}
        onFieldSelect={(fieldName) => {
          setExamField(fieldName);
          setPage("examProductSelect");
        }}
      />
    );
  }

  // Lab 페이지 (워크플로우)
  if (page === "workflow") {
    return (
      <WorkflowPage
        onHome={() => setPage("landing")}
        onStudy={() => setPage("study")}
        onTest={() => setPage("examFieldSelect")}
      />
    );
  }

  // Learn 페이지 (3D 뷰어)
  if (page === "learn") {
    return (
      <LearnPage
        selectedModel={selectedModel}
        onHome={() => setPage("landing")}
        onStudy={() => setPage("study")}
        onLab={() => setPage("workflow")}
        onTest={() => setPage("examFieldSelect")}

        // ✅ 추가: 모델 선택(모델 리스트)로 돌아가기
        onBack={() => setPage("productList")} 
      />
    );
  }

  // 모델 목록 페이지
  if (page === "productList") {
    return (
      <ProductListPage
        field={selectedField}
        onHome={() => setPage("landing")}
        onBack={() => setPage("study")}
        onLab={() => setPage("workflow")}
        onTest={() => setPage("examFieldSelect")}
        onLearn={(model) => {
          setSelectedModel(model);
          setPage("learn");
        }}
      />
    );
  }

  // Study 페이지
  if (page === "study") {
    return (
      <StudyPage
        onHome={() => setPage("landing")}
        onLab={() => setPage("workflow")}
        onTest={() => setPage("examFieldSelect")}
        onFieldSelect={(fieldName) => {
          setSelectedField(fieldName);
          setPage("productList");
        }}
      />
    );
  }

  // Landing 페이지
  return (
    <SimvexLanding
      onStart={() => setPage("study")}
      onLab={() => setPage("workflow")}
      onTest={() => setPage("examFieldSelect")}
    />
  );
}