"use client";
import React, { useState } from "react";
import { FileUpIcon, ReceiptIcon, BarChartIcon, UsersIcon } from "../../components/Icons";

export default function ImportPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const importMethods = [
    {
      id: "excel",
      title: "Excel / Google Sheets",
      description: "Import your financial spreadsheets directly.",
      icon: <BarChartIcon size={24} color="#10B981" />,
      options: ["Upload Excel File", "Skip for now"]
    },
    {
      id: "accounting",
      title: "Tally / Zoho / Quickbooks",
      description: "Connect your accounting software or export files.",
      icon: <ReceiptIcon size={24} color="#3B82F6" />,
      options: ["Upload Export File", "Skip for now"]
    },
    {
      id: "manual",
      title: "Notebook / Manual",
      description: "Upload images of your paper records for AI extraction.",
      icon: <FileUpIcon size={24} color="#F59E0B" />,
      options: ["Upload Image / Photo"]
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Import Your Data</h1>
        <p className="text-slate-500">Choose how you want to bring your business data into ProfitPilot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {importMethods.map((method) => (
          <div 
            key={method.id}
            className={`cursor-pointer transition-all duration-300 border rounded-2xl p-6 bg-white hover:shadow-xl ${
              selectedMethod === method.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-100'
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4`}>
              {method.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{method.title}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {method.description}
            </p>

            <div className="space-y-3">
              {method.options.map((opt) => (
                <button
                  key={opt}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    opt === "Skip for now" 
                      ? "text-slate-500 hover:bg-slate-50" 
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Action: ${opt}`);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedMethod && (
        <div className="mt-12 bg-white border border-slate-100 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileUpIcon size={32} color="#2563EB" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Upload?</h3>
            <p className="text-slate-500 mb-6">
              Drop your files here or click the buttons above to process your {
                importMethods.find(m => m.id === selectedMethod)?.title
              } data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
