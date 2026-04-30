import {
    parseModelIds,
    parseCount,
    validateAnswers,
    calculateScore,
} from "../../domain/exam/exam.entity";
// catalog 의존성은 현재 단계에서 service 가 직접 호출.
// 추후 catalog 가 동적 데이터로 진화하면 CatalogRepository 패턴으로 옮길 자리.
import { generateExamQuestions, gradeExam } from "../../core/catalog";
import type { ExamQuestion, ExamResultResponse } from "@simvex/shared";

export class ExamService {
    /**
     * generateQuestions — modelIds + count 검증 → catalog 의 시험 문제 생성.
     *
     * entity 함수 (parseModelIds, parseCount) 가 입력 검증 책임.
     * service 는 entity + catalog 호출 조율.
     */
    generateQuestions(input: {
        modelIdsText: string | undefined;
        countRaw: string | number | undefined;
    }): ExamQuestion[] {
        const modelIds = parseModelIds(input.modelIdsText);
        const count = parseCount(input.countRaw);
        return generateExamQuestions(modelIds, count);
    }

    /**
     * gradeAndScore — answers 배열 검증 → catalog 의 채점 → score 계산.
     *
     * 채점 결과 (correctCount, total, results) 를 받아서 score 까지 추가하여 반환.
     */
    gradeAndScore(input: { answers: unknown }): ExamResultResponse {
        validateAnswers(input.answers);  // assertion — 이후 input.answers 가 ExamSubmitRequest["answers"]
        
        const graded = gradeExam(input.answers);
        const score = calculateScore(graded.correctCount, graded.total);
        
        return {
        total: graded.total,
        correctCount: graded.correctCount,
        score,
        results: graded.results,
        };
    }
}