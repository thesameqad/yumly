import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Star,
  Utensils,
  Search,
  Sparkles,
  Clock,
  DollarSign,
  Flame,
  Navigation,
  MessageCircle,
} from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate("/chat", { state: { initialMessage: query } });
    } else {
      navigate("/chat");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-yum-50 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yum-500 to-yum-600 rounded-xl flex items-center justify-center shadow-lg shadow-yum-200">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">
            Yumly
          </span>
        </button>
        <button
          onClick={() => navigate("/chat")}
          className="px-6 py-2.5 bg-white text-yum-600 font-semibold rounded-full shadow-sm hover:shadow-md transition-all border border-yum-100"
        >
          Open App
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        {/* Background Elements */}
        <div className="absolute top-20 right-0 -z-10 opacity-10 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="w-[800px] h-[800px] rounded-full border-[60px] border-yum-200 border-dashed"
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yum-50 text-yum-700 rounded-full text-sm font-medium border border-yum-100"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Dining Assistant</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight"
            >
              Discover your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yum-500 to-yum-700">
                favorite meal
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-lg leading-relaxed"
            >
              Stop scrolling through endless reviews. Just tell Yumly what
              you're craving, and get personalized recommendations instantly.
            </motion.p>

            <motion.form
              variants={itemVariants}
              onSubmit={handleStartChat}
              className="relative max-w-lg group"
            >
              <div className="absolute inset-0 bg-yum-200 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-yum-100/50 p-2 border border-gray-100">
                <div className="pl-4 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Best sushi in downtown..."
                  className="flex-1 px-4 py-4 bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-400 text-gray-900"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yum-500 to-yum-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-yum-500/30 transition-all flex items-center gap-2 group/btn"
                >
                  <span>Ask</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="flex justify-end mt-2 pr-2">
                <a
                  href="https://www.yelp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <span className="text-[10px] text-gray-500 font-medium">
                    Powered by
                  </span>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg"
                    alt="Yelp"
                    className="h-3.5"
                  />
                </a>
              </div>
            </motion.form>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-8 pt-2"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Loved by foodies everywhere
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 animate-float">
              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-yum-900/10 p-6 max-w-md mx-auto border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yum-100 rounded-full flex items-center justify-center text-yum-600">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Best Pizza Nearby
                    </h3>
                    <p className="text-sm text-gray-500">
                      Found 3 top-rated places
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`https://images.unsplash.com/photo-${
                            i === 1
                              ? "1513104890138-7c749659a591"
                              : i === 2
                              ? "1574071318508-1cdbab80d002"
                              : "1604382354936-07c5d9983bd3"
                          }?auto=format&fit=crop&w=200&q=80`}
                          alt="Food"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900">
                            Tony's Pizzeria
                          </h4>
                          <span className="flex items-center text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            4.{8 - i}{" "}
                            <Star className="w-3 h-3 ml-1 fill-current" />
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Italian • $$ • 0.{i + 2} mi
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            Wood fired
                          </span>
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            Cozy
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -top-12 -right-12 bg-white p-4 rounded-2xl shadow-xl shadow-yum-500/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-bold text-gray-900">
                    San Francisco, CA
                  </p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl shadow-yum-500/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">AI Match</p>
                  <p className="text-sm font-bold text-gray-900">98% Match</p>
                </div>
              </motion.div>
            </div>

            {/* Decorative Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-yum-200/50 to-orange-200/50 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </main>

      {/* Use Cases Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-yum-50 to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yum-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-yum-600 rounded-full text-sm font-semibold border border-yum-100 shadow-sm mb-6">
              <Sparkles className="w-4 h-4" />
              What Can Yumly Do?
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Your AI dining companion for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yum-500 to-orange-500">
                every craving
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From quick bites to special occasions, Yumly understands what
              you're looking for
            </p>
          </motion.div>

          {/* Use Case Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 - Find Food Near Me */}
            <UseCaseCard
              index={0}
              icon={<MapPin className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-blue-500 to-cyan-500"
              title="Find Food Near Me"
              description="Quick discovery based on your location"
              examples={[
                "Pizza places near me",
                "Coffee shops nearby",
                "Thai food around here",
              ]}
              image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Pizza places near me" },
                })
              }
            />

            {/* Card 2 - Best Rated */}
            <UseCaseCard
              index={1}
              icon={<Star className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-yellow-500 to-orange-500"
              title="Find the Best Rated"
              description="Quality-first recommendations"
              examples={[
                "Best Italian in Frisco",
                "Top rated sushi in Dallas",
                "Highest rated brunch spots",
              ]}
              image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: {
                    initialMessage: "Best Italian restaurant in Frisco",
                  },
                })
              }
            />

            {/* Card 3 - Popular Spots */}
            <UseCaseCard
              index={2}
              icon={<Flame className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-red-500 to-pink-500"
              title="Popular Local Favorites"
              description="Discover what everyone's talking about"
              examples={[
                "Popular burger places",
                "Most reviewed Mexican",
                "Famous pizza spots",
              ]}
              image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Popular burger places near me" },
                })
              }
            />

            {/* Card 4 - Closest Option */}
            <UseCaseCard
              index={3}
              icon={<Navigation className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-green-500 to-emerald-500"
              title="Find the Closest"
              description="When you're hungry and don't want to travel"
              examples={[
                "Closest coffee shop",
                "Nearest taco place",
                "Closest open restaurant",
              ]}
              image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Closest coffee shop" },
                })
              }
            />

            {/* Card 5 - Budget Friendly */}
            <UseCaseCard
              index={4}
              icon={<DollarSign className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
              title="Budget-Friendly Options"
              description="Great food without spending too much"
              examples={[
                "Cheap eats downtown",
                "$ restaurants near me",
                "Affordable lunch spots",
              ]}
              image="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Cheap eats near me" },
                })
              }
            />

            {/* Card 6 - Open Now */}
            <UseCaseCard
              index={5}
              icon={<Clock className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-purple-500 to-indigo-500"
              title="Open Right Now"
              description="No guessing if they're closed"
              examples={[
                "Thai restaurants open now",
                "Coffee shops open",
                "What's open late?",
              ]}
              image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Restaurants open now near me" },
                })
              }
            />
          </div>

          {/* Featured Card - Place Details */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <div
              onClick={() =>
                navigate("/chat", {
                  state: { initialMessage: "Tell me more about Uchi Dallas" },
                })
              }
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yum-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left - Content */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yum-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                        <MessageCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-yum-600 uppercase tracking-wider">
                          Deep Research
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Learn About Any Place
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">
                      Want to know more before you go? Ask Yumly about any
                      specific restaurant and get detailed insights about the
                      vibe, what to order, and what makes it special.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[
                        "Tell me more about Uchi Dallas",
                        "What's the vibe at Velvet Taco?",
                        "Details about Pizza Twist",
                      ].map((example, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-700 border border-gray-200"
                        >
                          "{example}"
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-yum-600 font-semibold group-hover:gap-4 transition-all">
                      <span>Try it now</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  {/* Right - Visual */}
                  <div className="relative h-64 lg:h-auto overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
                      alt="Restaurant interior"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent lg:via-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Ready to find your next favorite spot?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Just tell Yumly what you're in the mood for.
          </p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yum-500 to-yum-600 text-white font-semibold text-lg rounded-full shadow-lg shadow-yum-500/30 hover:shadow-xl hover:shadow-yum-500/40 transition-all group"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          Developed by Anton Yermolayev. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// 3D Tilt Card Component
interface UseCaseCardProps {
  index: number;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  examples: string[];
  image: string;
  onClick: () => void;
}

function UseCaseCard({
  index,
  icon,
  iconBg,
  title,
  description,
  examples,
  image,
  onClick,
}: UseCaseCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-200 ease-out group-hover:shadow-2xl"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Icon Badge */}
          <div
            className={`absolute bottom-4 left-4 w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center text-white shadow-lg`}
            style={{ transform: "translateZ(30px)" }}
          >
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-4">{description}</p>

          {/* Examples */}
          <div className="space-y-2">
            {examples.map((example, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-yum-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yum-400" />
                <span>"{example}"</span>
              </div>
            ))}
          </div>

          {/* Hover Arrow */}
          <div className="mt-4 flex items-center gap-2 text-yum-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm">Try this</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>
    </motion.div>
  );
}
