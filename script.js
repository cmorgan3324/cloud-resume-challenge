// Mobile Navigation Toggle
let hamburger, navMenu; // Declare in broader scope

document.addEventListener("DOMContentLoaded", () => {
  hamburger = document.querySelector(".hamburger");
  navMenu = document.querySelector(".nav-menu");

  console.log("Hamburger element:", hamburger);
  console.log("Nav menu element:", navMenu);

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Hamburger clicked!");
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      console.log("Nav menu classes:", navMenu.classList);
    });

    // Close mobile menu when clicking on a link and update indicator
    document.querySelectorAll(".nav-link").forEach((link) =>
      link.addEventListener("click", () => {
        // Close the mobile menu
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");

        // Update sliding indicator immediately on click
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        updateSlidingIndicator(link);
      })
    );
  } else {
    console.error("Hamburger or nav menu not found");
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Share functionality
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById('share-btn');
  
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      const shareData = {
        title: 'Cory Morgan - AI/Cloud Portfolio',
        text: 'Check out my AI and Cloud engineering portfolio featuring AWS projects and solutions architecture.',
        url: window.location.href
      };

      // Check if Web Share API is supported
      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('Portfolio shared successfully'))
          .catch((err) => console.log('Error sharing:', err));
      } else {
        // Fallback: Copy link to clipboard
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            // Show temporary feedback
            const originalText = shareBtn.innerHTML;
            shareBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            shareBtn.style.background = 'var(--neon-purple)';
            shareBtn.style.color = 'var(--text-primary)';
            shareBtn.style.borderColor = 'var(--neon-purple)';
            
            setTimeout(() => {
              shareBtn.innerHTML = originalText;
              shareBtn.style.background = 'transparent';
              shareBtn.style.color = 'var(--electric-blue)';
              shareBtn.style.borderColor = 'var(--electric-blue)';
            }, 2000);
          })
          .catch((err) => {
            console.log('Error copying to clipboard:', err);
            // Fallback: Show URL in alert
            alert('Share this portfolio: ' + window.location.href);
          });
      }
    });
  }
});

// Fade in animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

// Observe all fade-in elements
const fadeInElements = document.querySelectorAll(".fade-in");
console.log("Found fade-in elements:", fadeInElements.length);
fadeInElements.forEach((el) => {
  observer.observe(el);
});

// Function to update sliding indicator position
function updateSlidingIndicator(activeLink) {
  const navMenu = document.querySelector(".nav-menu");
  const indicator = navMenu.querySelector("::after") || navMenu;

  if (activeLink) {
    const linkRect = activeLink.getBoundingClientRect();
    const navRect = navMenu.getBoundingClientRect();
    const offsetLeft = linkRect.left - navRect.left;
    const linkWidth = linkRect.width;

    // Update the sliding indicator via CSS custom properties
    navMenu.style.setProperty("--indicator-left", `${offsetLeft}px`);
    navMenu.style.setProperty("--indicator-width", `${linkWidth}px`);
    navMenu.style.setProperty("--indicator-opacity", "1");
  } else {
    navMenu.style.setProperty("--indicator-opacity", "0");
  }
}

// Add active class to navigation based on scroll position
window.addEventListener("scroll", () => {
  let current = "";
  const sections = document.querySelectorAll("section");
  const scrollPosition = window.scrollY + 300; // Offset for better detection

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    const sectionBottom = sectionTop + sectionHeight;

    // Check if we're in this section
    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      current = section.getAttribute("id");
    }
  });

  // Special handling for the last section (contact) when near bottom of page
  const lastSection = sections[sections.length - 1];
  const documentHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;

  if (window.scrollY + windowHeight >= documentHeight - 100) {
    current = lastSection.getAttribute("id");
  }

  // Update active link and sliding indicator
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
      updateSlidingIndicator(link);
    }
  });
});

// Add scroll effect to navbar
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 100) {
    navbar.style.background = "rgba(10, 10, 10, 0.98)";
    navbar.style.boxShadow = "0 4px 25px rgba(139, 92, 246, 0.2)";
  } else {
    navbar.style.background = "rgba(10, 10, 10, 0.95)";
    navbar.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.1)";
  }
});

// Enhanced typing effect that handles HTML properly with consistent timing
function typeWriter(element, finalHTML, speed = 100, callback = null) {
  element.style.opacity = "1";

  // Extract just the text content for typing
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = finalHTML;
  const textContent = tempDiv.textContent || tempDiv.innerText || "";

  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < textContent.length) {
      const currentText = textContent.substring(0, i + 1);

      // For the title, handle the "Cory" highlight character by character
      if (element.classList.contains("hero-title")) {
        // Check if we're in the "Cory" part
        const coryStartIndex = textContent.indexOf("Cory");
        const coryEndIndex = coryStartIndex + 4; // "Cory" is 4 characters

        if (i >= coryStartIndex && coryStartIndex !== -1) {
          // We're typing within or after "Cory"
          const beforeCory = textContent.substring(0, coryStartIndex);
          const coryTyped = textContent.substring(
            coryStartIndex,
            Math.min(i + 1, coryEndIndex)
          );
          const afterCory = textContent.substring(coryEndIndex, i + 1);

          if (i < coryEndIndex) {
            // Still typing "Cory"
            element.innerHTML =
              beforeCory +
              '<span class="highlight">' +
              coryTyped +
              '</span><span class="typing-cursor">|</span>';
          } else {
            // Finished "Cory", typing after
            element.innerHTML =
              beforeCory +
              '<span class="highlight">Cory</span>' +
              afterCory +
              '<span class="typing-cursor">|</span>';
          }
        } else {
          // Haven't reached "Cory" yet
          element.innerHTML =
            currentText + '<span class="typing-cursor">|</span>';
        }
      } else {
        // For other elements, just type normally
        element.innerHTML =
          currentText + '<span class="typing-cursor">|</span>';
      }

      i++;
      setTimeout(type, speed);
    } else {
      // Finished typing - set final HTML without cursor
      element.innerHTML = finalHTML;
      if (callback) {
        setTimeout(callback, 500);
      }
    }
  }
  type();
}

// Sequential typing effect for multiple elements
function sequentialTypeWriter(elements, speed = 80) {
  let currentIndex = 0;

  function typeNext() {
    if (currentIndex < elements.length) {
      const { element, text } = elements[currentIndex];
      currentIndex++;
      typeWriter(element, text, speed, typeNext);
    }
  }

  typeNext();
}

// Initialize typing effect and sliding indicator on page load
document.addEventListener("DOMContentLoaded", () => {
  // Setup typing effect for hero content
  const heroTitle = document.querySelector(".hero-title");
  const heroSubtitle = document.querySelector(".hero-subtitle");

  if (heroTitle && heroSubtitle) {
    // Store original text and hide elements initially
    const titleText = heroTitle.innerHTML;
    const subtitleText = heroSubtitle.innerHTML;

    heroTitle.style.opacity = "0";
    heroSubtitle.style.opacity = "0";

    // Start sequential typing effect after a short delay
    setTimeout(() => {
      sequentialTypeWriter(
        [
          { element: heroTitle, text: titleText },
          { element: heroSubtitle, text: subtitleText },
        ],
        60
      ); // 60ms per character for smooth typing
    }, 800); // Wait 800ms after page load
  }

  // Initialize sliding indicator
  const activeLink =
    document.querySelector(".nav-link.active") ||
    document.querySelector(".nav-link");
  if (activeLink) {
    updateSlidingIndicator(activeLink);
  }

  // Recalculate indicator position on window resize
  window.addEventListener("resize", () => {
    const currentActive = document.querySelector(".nav-link.active");
    if (currentActive) {
      updateSlidingIndicator(currentActive);
    }
  });
});

// Project card hover effects
document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-10px) scale(1.02)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0) scale(1)";
  });
});

// Contact form validation (if you add a contact form later)
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Add loading state for external links
document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const originalText = link.innerHTML;
    link.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';

    setTimeout(() => {
      link.innerHTML = originalText;
    }, 2000);
  });
});

// Visitor Counter Functionality
class VisitorCounter {
  constructor() {
    this.counterElement = document.getElementById("visitorCount");
    this.init();
  }

  init() {
    // Add loading class for animation
    this.counterElement.classList.add("loading");

    // Call the API
    this.updateCounter();
  }

  async updateCounter() {
    try {
      // Call the API to get and increment visitor count
      const response = await fetch("https://h066pqp3yl.execute-api.us-east-1.amazonaws.com/count");
      const data = await response.json();
      
      if (data.count) {
        // Animate the counter update
        this.animateCounter(data.count);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.log("Visitor counter error:", error);
      // Fallback to a static number if API fails
      this.displayCount(42);
    }
  }

  animateCounter(targetCount) {
    const startCount = 0;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(
        startCount + (targetCount - startCount) * easeOutQuart
      );

      this.displayCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove loading class when animation is complete
        this.counterElement.classList.remove("loading");
      }
    };

    requestAnimationFrame(animate);
  }

  displayCount(count) {
    // Format number with commas for better readability
    const formattedCount = count.toLocaleString();
    this.counterElement.textContent = formattedCount;
  }
}

// Initialize visitor counter when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new VisitorCounter();
});

// Add some visual feedback when counter is hovered
document.addEventListener("DOMContentLoaded", () => {
  const counterElement = document.querySelector(".visitor-counter");

  if (counterElement) {
    counterElement.addEventListener("mouseenter", () => {
      counterElement.style.transform = "scale(1.05)";
      counterElement.style.boxShadow =
        "0 8px 25px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
    });

    counterElement.addEventListener("mouseleave", () => {
      counterElement.style.transform = "scale(1)";
      counterElement.style.boxShadow =
        "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
    });
  }
});

// Skill link functionality - navigate to relevant projects
document.addEventListener("DOMContentLoaded", () => {
  const skillLinks = document.querySelectorAll(".skill-link");
  const projectCards = document.querySelectorAll(".project-card");
  let isSkillHighlighting = false;

  // Temporarily disable hover effects during skill highlighting
  function disableHoverEffects() {
    isSkillHighlighting = true;
    projectCards.forEach((card) => {
      card.style.pointerEvents = "none";
    });
  }

  function enableHoverEffects() {
    isSkillHighlighting = false;
    projectCards.forEach((card) => {
      card.style.pointerEvents = "auto";
    });
  }

  skillLinks.forEach((skillLink) => {
    skillLink.addEventListener("click", () => {
      const projectIndices = skillLink.getAttribute("data-projects");
      if (projectIndices) {
        const indices = projectIndices
          .split(",")
          .map((i) => parseInt(i.trim()));

        // Find the first highlighted project to center on
        const firstProjectIndex = indices[0];
        const firstProject = projectCards[firstProjectIndex];

        if (firstProject) {
          // Disable hover effects during highlighting
          disableHoverEffects();

          // Remove any existing highlights
          projectCards.forEach((card) => {
            card.style.transition = "all 0.3s ease";
            card.style.boxShadow = "";
            card.style.transform = "";
          });

          // Scroll to center the first highlighted project
          firstProject.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Add highlight to relevant projects after scroll
          setTimeout(() => {
            indices.forEach((index) => {
              if (projectCards[index]) {
                projectCards[index].style.boxShadow =
                  "0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                projectCards[index].style.transform = "translateY(-8px)";
              }
            });

            // Remove highlight after 2 seconds and re-enable hover
            setTimeout(() => {
              indices.forEach((index) => {
                if (projectCards[index]) {
                  projectCards[index].style.boxShadow = "";
                  projectCards[index].style.transform = "";
                }
              });
              enableHoverEffects();
            }, 2000);
          }, 800);
        }
      }
    });
  });
});
