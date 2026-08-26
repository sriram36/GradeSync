export type BBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Question = {
  id: string;
  number: string;
  sub_part: string | null;
  display_label: string;
  text: string;
  max_marks: number | null;
  marks_source: "printed" | "estimated";
  bbox: BBox | null;
  order_index: number;
};

export type AnswerBlock = {
  id: string;
  detected_label: string | null;
  text: string;
  bboxes: BBox[];
  order_index: number;
};

export type Mapping = {
  question_id: string;
  answer_block_id: string | null;
  confidence: number;
  status: "answered" | "unanswered" | "low_confidence";
};

export type Grade = {
  question_id: string;
  marks_awarded: number;
  max_marks: number;
  correct: boolean | null;
  feedback: string;
};

export type PageImage = {
  page: number;
  url: string;
  width: number;
  height: number;
};

export type JobStatus = {
  job_id: string;
  status: "processing" | "done" | "error";
  stage?: string | null;
  error?: string | null;
};

export type JobResult = {
  job_id: string;
  status: "processing" | "done" | "error";
  stage?: string | null;
  error?: string | null;
  questions: Question[];
  answer_blocks: AnswerBlock[];
  mappings: Mapping[];
  grades: Grade[];
  unmatched_answer_ids: string[];
  question_paper_pages: PageImage[];
  answer_sheet_pages: PageImage[];
  total_awarded: number;
  total_max: number;
};
