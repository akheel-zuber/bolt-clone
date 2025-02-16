import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  MessageSquare,
  Code2,
  Eye,
  File,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { FileItem, Step, StepType } from "../types";
import { parseXml } from "../steps";
import { useWebContainer } from "../hooks/useWebContainer";
import { PreviewFrame } from "../components/PreviewFrame";

interface LocationState {
  prompt: string;
}

function Builder() {
  const location = useLocation();
  const { prompt } = location.state as LocationState;
  const { webcontainer, error } = useWebContainer();
  const [userInput, setUserInput] = useState("");
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/"])
  );
  const [selectedFile, setSelectedFile] = useState("/src/index.html");
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: "completed",
          };
        })
      );
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === "folder") {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [
                    child.name,
                    processFile(child, false),
                  ])
                )
              : {},
          };
        } else if (file.type === "file") {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || "",
              },
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || "",
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach((file) => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserInput("");
  };

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim(),
    });
    const { prompts, uiPrompts } = response.data;
    setSteps(
      parseXml(uiPrompts[0]).map((step: Step) => ({
        ...step,
        status: "pending",
      }))
    );
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map((content) => ({
        role: "user",
        parts: [{ text: content }],
      })),
    });
    setSteps((s) => [
      ...s,
      ...parseXml(stepsResponse.data.code).map((x) => ({
        ...x,
        status: "pending" as "pending",
      })),
    ]);
  }

  useEffect(() => {
    init();
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileContent = (path: string): string => {
    const parts = path.split("/").filter(Boolean);
    let current: FileItem[] = files;
    let content = "";

    for (const part of parts) {
      const found = current.find((item) => item.name === part);
      if (found) {
        if (found.type === "file") {
          content = found.content || "";
        } else if (found.children) {
          current = found.children;
        }
      }
    }

    return content;
  };

  const renderFileTree = (items: FileItem[], path = "") => {
    return items.map((item) => {
      const fullPath = `${path}/${item.name}`;
      const isExpanded = expandedFolders.has(fullPath);
      const isSelected = selectedFile === fullPath;

      return (
        <div key={fullPath}>
          <div
            className={`flex items-center px-2 py-1.5 cursor-pointer hover:bg-indigo-500/20 rounded transition-colors duration-150 ${
              isSelected ? "bg-indigo-500/30 text-indigo-200" : "text-gray-300"
            }`}
            onClick={() => {
              if (item.type === "folder") {
                toggleFolder(fullPath);
              } else {
                setSelectedFile(fullPath);
              }
            }}
          >
            <span className="mr-1.5">
              {item.type === "folder" ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-indigo-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                )
              ) : (
                <File className="w-4 h-4 text-indigo-300" />
              )}
            </span>
            {item.type === "folder" ? (
              <FolderOpen className="w-4 h-4 text-amber-400 mr-2" />
            ) : null}
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          {item.type === "folder" && isExpanded && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 to-purple-950/50"></div>

      <div className="relative flex-1 flex">
        {/* Steps Panel */}
        <div className="w-1/4 bg-gray-950/80 backdrop-blur-lg border-r border-gray-800 flex flex-col">
          {/* Main container with proper height constraints */}
          <div className="flex flex-col h-full min-h-0">
            {/* Header Section */}
            <div className="pt-6 px-6 pb-4">
              <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Building Steps
              </h2>
            </div>

            {/* Scrollable Steps List */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 max-h-[calc(100vh-260px)]">
              <div className="space-y-4 min-h-[200px]">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-indigo-500/30 transition-colors duration-300 group"
                  >
                    <div className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-950/80 text-indigo-300 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-200 text-sm font-medium">
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="text-gray-400 text-sm mt-1.5">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Bottom Form */}
            <div className="sticky bottom-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl p-4 h-[200px]">
              <form onSubmit={handleInputSubmit} className="space-y-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Add more instructions..."
                  className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none transition-all duration-200 text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-gray-100 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="sticky w-3/4 flex flex-col bg-gray-950/50 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeTab === "code"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeTab === "preview"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <div className="ml-auto">
              <button
                onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors duration-200"
                title={isExplorerOpen ? "Hide Explorer" : "Show Explorer"}
              >
                {isExplorerOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Content with File Explorer */}
          <div className="flex-1 flex">
            {/* File Explorer */}
            <div
              className={`${
                isExplorerOpen ? "w-64" : "w-0"
              } transition-all duration-300 border-r border-gray-800 bg-gray-900/70 backdrop-blur-sm overflow-hidden`}
            >
              <div className="p-4 h-full overflow-y-auto">
                <h3 className="text-sm font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Files
                </h3>
                {renderFileTree(files)}
              </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="flex-1 p-4">
              {activeTab === "code" ? (
                <div className="h-full rounded-lg overflow-hidden border border-gray-800 shadow-lg shadow-black/20">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={getFileContent(selectedFile)}
                    onChange={(value) => {
                      // Handle file content updates here
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "JetBrains Mono, monospace",
                      padding: { top: 20 },
                    }}
                  />
                </div>
              ) : (
                <PreviewFrame webcontainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Builder;
