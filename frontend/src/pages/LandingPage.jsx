import { Link } from "react-router-dom";
import { MessageSquare, Users, Shield, Zap, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    desc: "Instant delivery with sent, delivered, and seen indicators so you always know the status.",
  },
  {
    icon: Users,
    title: "Friend System",
    desc: "Add friends by username, accept requests, and keep your conversations organized.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "End-to-end encrypted connections with verified email accounts for your safety.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Optimized for speed with image compression, skeleton loaders, and optimistic UI.",
  },
];

const highlights = [
  "Send text & images instantly",
  "3-tick read receipt system",
  "30+ beautiful themes",
  "Friend requests & search",
  "Online presence indicators",
  "Responsive on all devices",
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="size-4" />
            Now with friend requests & verified emails
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Chat with friends,
            <br />
            <span className="text-primary">not strangers.</span>
          </h1>

          <p className="mt-6 text-lg text-base-content/60 max-w-2xl mx-auto leading-relaxed">
            ChitChat is a modern real-time messaging app where you connect with people you actually know.
            Add friends, share moments, and stay in touch — all in a clean, beautiful interface.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="btn btn-primary btn-lg gap-2 px-8 shadow-lg shadow-primary/25"
            >
              Get Started Free
              <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/login"
              className="btn btn-ghost btn-lg gap-2 px-8"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Animated chat preview */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-base-200 rounded-2xl p-6 sm:p-8 shadow-xl border border-base-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-300">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageSquare className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">ChitChat Preview</div>
                <div className="text-xs text-success">Online</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-primary">Hey! Welcome to ChitChat 👋</div>
              </div>
              <div className="chat chat-end">
                <div className="chat-bubble">This looks awesome! How do I add friends?</div>
              </div>
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-primary">
                  Just search by @username and send a request. It's that easy!
                </div>
              </div>
              <div className="chat chat-end">
                <div className="chat-bubble">Love the read receipts too ✓✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-4 bg-base-200/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to <span className="text-primary">stay connected</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-base-100 rounded-xl p-6 border border-base-300 hover:shadow-lg transition-shadow"
              >
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">What's inside</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-3 p-3 rounded-lg">
                <CheckCircle className="size-5 text-success shrink-0" />
                <span className="text-base-content/80">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12">
          <MessageSquare className="size-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to start chatting?</h2>
          <p className="text-base-content/60 mb-8">
            Create your free account in seconds. No credit card, no spam.
          </p>
          <Link
            to="/signup"
            className="btn btn-primary btn-lg gap-2 px-10"
          >
            Create Account
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-base-300">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-base-content/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            <span>ChitChat</span>
          </div>
          <p>Built with ❤️ by Utkarsh Raj</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
