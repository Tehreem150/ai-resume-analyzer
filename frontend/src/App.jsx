import { useState } from "react";
import axios from "axios";
import { FileText, FileType2, Upload, Search } from "lucide-react";
import CircularProgress from "./components/CircularProgress";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isValidFile, setIsValidFile] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AI analysis
  const [jobDescription, setJobDescription] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const maxFileSize = 5 * 1024 * 1024;

  const validateFile = (f) => {
    if (!allowedTypes.includes(f.type)) {
      setMessage("⚠️ Only PDF and DOCX files are allowed.");
      setIsValidFile(false);
      return false;
    }
    if (f.size > maxFileSize) {
      setMessage("⚠️ File size must be less than 5 MB.");
      setIsValidFile(false);
      return false;
    }
    setIsValidFile(true);
    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && validateFile(f)) {
      setFile(f);
      setMessage("");
      setProgress(0);
      setAnalysisResult(null);

      if (f.type === "application/pdf") {
        const reader = new FileReader();
        reader.onloadend = () => setPdfPreview(reader.result);
        reader.readAsDataURL(f);
      } else {
        setPdfPreview(null);
      }
    } else {
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  // Upload file & extract text
 const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeText(res.data.text);
    } catch (err) {
      alert("Failed to upload file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // AI Resume Analysis
 const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/analyze", {
        resumeText,
        jobDescription,
      });
      setAnalysis(res.data);
    } catch (err) {
      alert("Failed to analyze resume.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleReset = () => {
    setFile(null);
    setText("");
    setMessage("");
    setProgress(0);
    setIsValidFile(false);
    setPdfPreview(null);
    setAnalysisResult(null);
    setJobDescription("");
  };

  const wordCount = text ? text.trim().split(/\s+/).length : 0;
  const charCount = text ? text.length : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-200 p-6">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🤖 AI Resume Analyzer
        </h1>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {!file && (
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${
                dragActive
                  ? "border-blue-600 bg-blue-50"
                  : "border-blue-400 hover:bg-blue-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload").click()}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
              />
              <FileType2 className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-gray-600 text-center font-medium">
                Drag & Drop your resume here <br /> or click to browse
              </p>
            </div>
          )}

          {file && (
            <div className="w-full border rounded-lg p-4 shadow-sm bg-white">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-gray-100 border">
                  {file.type === "application/pdf" ? (
                    <FileText className="w-7 h-7 text-red-500" />
                  ) : (
                    <FileType2 className="w-7 h-7 text-blue-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>

                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-red-600 text-sm hover:underline"
                    >
                      ❌ Remove
                    </button>
                    <label
                      htmlFor="change-file"
                      className="text-blue-600 text-sm cursor-pointer hover:underline"
                    >
                      🔄 Change File
                    </label>
                    <input
                      type="file"
                      id="change-file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {file && (
            <button
              type="submit"
              disabled={!isValidFile || loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl shadow font-semibold transition-transform ${
                !isValidFile || loading
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-105"
              }`}
            >
              <Upload className="w-5 h-5" />
              {loading ? "⏳ Uploading..." : "🚀 Upload & Extract"}
            </button>
          )}
        </form>

        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {progress > 0 && !loading && (
          <p className="text-sm text-gray-600 mt-1 text-center">
            ✅ Upload complete ({progress}%)
          </p>
        )}

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.startsWith("⚠️") || message.startsWith("❌")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* Job Description & Analyze */}
        {text && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📝 Job Description
            </h2>
            <textarea
              className="w-full p-3 border rounded-lg text-sm shadow-inner focus:ring-2 focus:ring-blue-400"
              rows="4"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow hover:scale-105 transition-transform"
            >
              <Search className="w-5 h-5" />
              {analysisLoading ? "🤖 Analyzing..." : "🔍 Analyze Resume"}
            </button>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysisResult && (
          <div className="mt-6 p-6 border rounded-2xl bg-gradient-to-br from-white to-gray-100 shadow-inner space-y-6">
            <h2 className="text-xl font-bold text-gray-800">
              📊 AI Analysis Result
            </h2>

            {/* Score */}
         <div className="flex flex-col items-center justify-center">
  <CircularProgress score={analysisResult.score ?? 0} />
  <p className="mt-2 font-semibold text-gray-700">Resume Match Score</p>
</div>


            {/* Skills */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl shadow">
                <h3 className="font-semibold text-green-700">
                  ✅ Matched Skills
                </h3>
                <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
                  {analysisResult.matchedSkills?.length > 0
                    ? analysisResult.matchedSkills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))
                    : "No matches found"}
                </ul>
              </div>
              <div className="p-4 bg-red-50 rounded-xl shadow">
                <h3 className="font-semibold text-red-700">
                  ⚠️ Missing Skills
                </h3>
                <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
                  {analysisResult.missingSkills?.length > 0
                    ? analysisResult.missingSkills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))
                    : "No missing skills"}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl shadow">
              <h3 className="font-semibold text-yellow-700">💡 Suggestions</h3>
              <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
                {analysisResult.suggestions?.length > 0
                  ? analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)
                  : "No suggestions provided"}
              </ul>
            </div>
          </div>
        )}

        {/* Full Text Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                ❌
              </button>
              <h2 className="text-lg font-semibold mb-4">
                Extracted Resume Text
              </h2>
              <div className="flex gap-6 mb-4 text-sm text-gray-600">
                <p>
                  📝 Words: <span className="font-medium">{wordCount}</span>
                </p>
                <p>
                  🔡 Characters:{" "}
                  <span className="font-medium">{charCount}</span>
                </p>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {text}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
