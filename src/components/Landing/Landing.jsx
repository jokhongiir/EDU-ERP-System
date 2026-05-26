import "./Landing.css";
import { useState } from "react";
import {
  FiArrowRight,
  FiCheckCircle,
  FiUsers,
  FiBookOpen,
  FiBarChart2,
  FiShield,
  FiGlobe,
  FiMonitor,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronDown,
  FiPlay,
  FiHelpCircle,
  FiLogIn,
} from "react-icons/fi";

const Landing = () => {
  const [lang, setLang] = useState("EN");
  const [activeFaq, setActiveFaq] = useState(null); // FAQ akordeon boshqaruvi

  const faqData = [
    {
      question: "How does EDU ERP work?",
      answer:
        "EDU ERP helps schools and learning centers manage students, teachers, payments, attendance and analytics in one system.",
    },
    {
      question: "Can I use it on mobile devices?",
      answer:
        "Yes. EDU ERP is fully responsive and works perfectly on phones, tablets and desktops.",
    },
    {
      question: "Does the system support multiple branches?",
      answer:
        "Yes. You can manage multiple branches, groups and teachers from one dashboard.",
    },
    {
      question: "Is the platform secure?",
      answer:
        "Absolutely. Your data is protected with advanced authentication and cloud security.",
    },
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Bu yerga backend integratsiyasini yozish mumkin
    alert("Message sent successfully!");
  };

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <div className="logo-icon">EDU</div>
            <div className="logo-text">
              <h2>EDU ERP</h2>
              <span>Education System</span>
            </div>
          </div>

          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-right">
            <div className="language-switcher">
              {["UZ", "RU", "EN"].map((item) => (
                <button
                  key={item}
                  className={lang === item ? "active-lang" : ""}
                  onClick={() => setLang(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <button className="login-btn">
              <FiLogIn />
              Login
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="container hero-container">
          <div className="hero-left">
            <div className="hero-badge">
              <span></span>
              Smart Education Platform
            </div>

            <h1>
              Modern ERP System
              <br />
              For Education
            </h1>

            <p>
              Manage students, teachers, courses, attendance, payments,
              analytics and education processes in one powerful platform.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn">
                Start Now
                <FiArrowRight />
              </button>
              <button className="secondary-btn">
                <FiPlay />
                Live Demo
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <h2>10K+</h2>
                <span>Students</span>
              </div>
              <div className="stat-card">
                <h2>500+</h2>
                <span>Teachers</span>
              </div>
              <div className="stat-card">
                <h2>99%</h2>
                <span>Success</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="dashboard-card">
              <div className="dashboard-header">
                <div className="dashboard-circle red"></div>
                <div className="dashboard-circle yellow"></div>
                <div className="dashboard-circle green"></div>
              </div>

              <div className="dashboard-content">
                <div className="mini-box">
                  <FiUsers />
                  <div>
                    <h3>2450</h3>
                    <p>Students</p>
                  </div>
                </div>

                <div className="mini-box">
                  <FiBookOpen />
                  <div>
                    <h3>84</h3>
                    <p>Courses</p>
                  </div>
                </div>

                <div className="chart-box"></div>

                <div className="table-box">
                  <div className="table-row"></div>
                  <div className="table-row"></div>
                  <div className="table-row"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about" id="about">
        <div className="container about-container">
          <div className="about-left">
            <span className="mini-title">About System</span>
            <h2>What Can EDU ERP Do?</h2>
            <p>
              EDU ERP is a professional platform designed for schools,
              universities and learning centers. The system automates
              educational processes and helps institutions manage everything
              efficiently.
            </p>

            <div className="about-list">
              {[
                "Student & Teacher Management",
                "Attendance Monitoring",
                "Payment & Finance Tracking",
                "Analytics Dashboard",
                "Multi Branch Support",
              ].map((item, idx) => (
                <div className="about-item" key={idx}>
                  <FiCheckCircle />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="about-right">
            <div className="about-card">
              <div className="about-icon">
                <FiMonitor />
              </div>
              <h3>Professional Dashboard</h3>
              <p>
                Beautiful modern interface with fast performance and secure
                cloud infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span>Features</span>
            <h2>Powerful Features</h2>
            <p>Everything you need for modern education management.</p>
          </div>

          <div className="features-grid">
            {[
              { icon: <FiUsers />, title: "Student Management", desc: "Manage all students and groups professionally." },
              { icon: <FiBookOpen />, title: "Courses", desc: "Create and manage courses and schedules easily." },
              { icon: <FiBarChart2 />, title: "Analytics", desc: "Real-time statistics and performance reports." },
              { icon: <FiShield />, title: "Security", desc: "Advanced security and protected user data." },
              { icon: <FiGlobe />, title: "Multi Language", desc: "Uzbek, Russian and English language support." },
              { icon: <FiMonitor />, title: "Responsive UI", desc: "Fully responsive and modern user interface." },
            ].map((feat, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-header">
            <span>FAQ</span>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-wrapper">
            {faqData.map((item, index) => (
              <div
                className={`faq-card ${activeFaq === index ? "active" : ""}`}
                key={index}
              >
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  <div className="faq-left">
                    <FiHelpCircle />
                    <h3>{item.question}</h3>
                  </div>
                  <FiChevronDown className="faq-icon-arrow" />
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="section-header">
            <span>Contact</span>
            <h2>Contact Us</h2>
            <p>Send us a message and we will contact you soon.</p>
          </div>

          <div className="contact-wrapper">
            <div className="contact-info">
              <div className="contact-box">
                <FiPhone />
                <div>
                  <h3>Phone</h3>
                  <p>+998 90 123 45 67</p>
                </div>
              </div>
              <div className="contact-box">
                <FiMail />
                <div>
                  <h3>Email</h3>
                  <p>info@eduerp.com</p>
                </div>
              </div>
              <div className="contact-box">
                <FiMapPin />
                <div>
                  <h3>Location</h3>
                  <p>Tashkent, Uzbekistan</p>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="input-group">
                <input type="text" placeholder="Full Name" required />
              </div>
              <div className="input-group">
                <input type="email" placeholder="Email Address" required />
              </div>
              <div className="input-group">
                <textarea rows="6" placeholder="Write your message..." required></textarea>
              </div>
              <button type="submit" className="primary-btn">
                Send Message
                <FiArrowRight />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-container">
          <div>
            <h2>EDU ERP</h2>
            <p>Modern Education Management System</p>
          </div>
          <p>© 2026 EDU ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;