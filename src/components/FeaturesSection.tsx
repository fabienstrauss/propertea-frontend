import { motion } from "framer-motion";
import { Zap, Shield, Clock, BarChart3, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Our AI processes your documents in seconds, extracting key property details automatically.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption ensures your property data stays safe and confidential.",
  },
  {
    icon: Clock,
    title: "Save Hours Weekly",
    description: "Automate tedious data entry and focus on what matters - growing your portfolio.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Get insights into your properties with AI-powered market analysis and recommendations.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members and manage permissions for seamless property management.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description: "Upload documents in any language. Our AI understands and translates automatically.",
  },
];

const FeaturesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-coral-light text-coral text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools designed to simplify your rental property management workflow.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-transparent transition-all duration-300 hover:shadow-airbnb-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-coral-light flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <feature.icon className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
