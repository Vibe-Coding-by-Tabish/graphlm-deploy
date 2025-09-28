import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Brain, FileText, Network } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authConfig);

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <Header />

      <main className="flex-1 border-t border-b border-slate-100">
        <section className="relative py-20 px-0 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="">
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight lg:text-6xl text-slate-900">
                Welcome to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">
                  GraphLM
                </span>{" "}
                AI-powered Knowledge Graphs from Research
              </h1>
              <p className="mb-8 text-lg text-slate-600 max-w-2xl mx-auto">
                Upload research papers, generate structured knowledge, and
                explore interactive insights with our cutting-edge AI
                technology.
              </p>

              <div className="flex items-center justify-center gap-4">
                {/* show different text and redirect depending on auth state */}
                {session ? (
                  <a
                    href="/workspace"
                    className="inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 rounded-full bg-gradient-to-r from-blue-600 to-teal-400 text-white ring-1 ring-blue-200/40 hover:scale-[1.02]"
                  >
                    Try GraphLM
                  </a>
                ) : (
                  <a
                    href={`/signin?callbackUrl=${encodeURIComponent(
                      "/workspace"
                    )}`}
                    className="inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 rounded-full bg-gradient-to-r from-blue-600 to-teal-400 text-white ring-1 ring-blue-200/40 hover:scale-[1.02]"
                  >
                    Get started
                  </a>
                )}
                <a
                  href="#features"
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 px-0">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-slate-900 mb-4">
                Transform Research into Knowledge Graphs
              </h2>
              <p className="text-base text-slate-600 max-w-2xl mx-auto">
                GraphLM revolutionizes how researchers explore and understand
                complex academic literature by automatically generating
                interactive knowledge graphs from PDF documents.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="rounded-xl text-center p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-teal-400 to-green-400 text-white">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Upload Research
                  </h3>
                  <p className="text-slate-600">
                    Simply upload your PDF research papers and let our AI
                    analyze the content.
                  </p>
                </div>
              </div>

              <div className="rounded-xl text-center p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-teal-400 text-white">
                      <Brain className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    AI Processing
                  </h3>
                  <p className="text-slate-600">
                    Our advanced AI extracts key concepts, relationships, and
                    insights from your documents.
                  </p>
                </div>
              </div>

              <div className="rounded-xl text-center p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-teal-400 to-green-400 text-white">
                      <Network className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Visualize Knowledge
                  </h3>
                  <p className="text-slate-600">
                    Explore interactive knowledge graphs that reveal hidden
                    connections in your research.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="max-w-2xl w-full bg-white border border-slate-100 shadow-md rounded-xl">
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-400 shadow-lg text-white">
                      <Network className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Ready to explore your research?
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Join researchers worldwide who are already using GraphLM to
                    unlock insights from their academic papers and discover new
                    connections in their field.
                  </p>
                  {session ? (
                    <a
                      href="/workspace"
                      className="inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-teal-400 rounded-full text-white"
                    >
                      Try GraphLM
                    </a>
                  ) : (
                    <a
                      href={`/signin?callbackUrl=${encodeURIComponent(
                        "/workspace"
                      )}`}
                      className="inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-teal-400 rounded-full text-white"
                    >
                      Get started
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
