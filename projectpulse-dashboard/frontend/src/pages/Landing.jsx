import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  MessageSquare,
  FileText,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
const features = [
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "AI-powered insights from your project data. Spot bottlenecks, track velocity, and predict delivery dates.",
  },
  {
    icon: MessageSquare,
    title: "AI chatbot",
    description:
      "chat with your project with help of AI chatbot",
  },
  {
    icon: FileText,
    title: "Automated Reports",
    description:
      "Generate comprehensive project reports automatically. Export and share with stakeholders.",
  },
];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};
export default function Landing() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ProjectPulse
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-8 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full gradient-primary" />
            AI-Powered Project Intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-5">
            Project Intelligence
            <br />
            <span className="bg-gradient-to-r from-primary to-[hsl(250,80%,62%)] bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your project data or connect Jira, then chat with AI to get
            instant analytics, insights, and sourced answers.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">View Demo</Link>
            </Button>
          </div>
        </motion.div>
      </section>
      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="group rounded-xl border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 ProjectPulse</span>
          <span>Built with AI</span>
        </div>
      </footer>
    </div>
  );
}
