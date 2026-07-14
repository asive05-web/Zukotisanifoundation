/* ==========================================================================
   ZUKO TISANI YOUTH LEADERSHIP FOUNDATION — MAIN JS
   ========================================================================== */

var YOCO_CHARGE_URL = "https://yococharge-hzj7232i5a-uc.a.run.app";

var EMAILJS_PUBLIC_KEY = "Z2z8aHrja4r3nrsb_";
var EMAILJS_SERVICE_ID = "service_gs4s7ob";
var EMAILJS_TEMPLATE_ID = "template_ulhfrdj";

var selectedDonationAmount = 500;
var isMonthlyDonation = false;

function initMobileNav() {
  var toggleBtn = document.getElementById("nav_toggle_btn");
  var panel = document.getElementById("mobile_nav_panel");

  if (!toggleBtn || !panel) {
    return;
  }

  toggleBtn.addEventListener("click", function () {
    panel.classList.toggle("is-open");
  });
}

function showStatusMessage(el, message, isError) {
  if (!el) {
    return;
  }

  el.textContent = message;
  el.classList.add("is-visible");
  el.classList.remove("form-status-error", "form-status-success");
  el.classList.add(isError ? "form-status-error" : "form-status-success");
}

function toggleProcessingOverlay(show) {
  var overlay = document.getElementById("processing_overlay");

  if (!overlay) {
    return;
  }

  overlay.classList.toggle("is-visible", show);
}

function setSelectedAmountButton(amount) {
  var buttons = document.querySelectorAll(".amount-btn");

  buttons.forEach(function (btn) {
    var btnAmount = parseInt(btn.getAttribute("data-amount"), 10);
    btn.classList.toggle("is-selected", btnAmount === amount);
  });

  var customInput = document.getElementById("custom_amount_input");
  if (customInput) {
    customInput.value = "";
  }
}

function updateDonateButtonLabel() {
  var donateBtn = document.getElementById("donate_submit_btn");

  if (!donateBtn) {
    return;
  }

  var suffix = isMonthlyDonation ? " / MONTH" : "";
  donateBtn.textContent = "DONATE R" + selectedDonationAmount.toLocaleString() + suffix + " \u2192";
}

function initDonateAmountButtons() {
  var buttons = document.querySelectorAll(".amount-btn");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectedDonationAmount = parseInt(btn.getAttribute("data-amount"), 10);
      setSelectedAmountButton(selectedDonationAmount);
      updateDonateButtonLabel();
    });
  });
}

function initCustomAmountInput() {
  var customInput = document.getElementById("custom_amount_input");

  if (!customInput) {
    return;
  }

  customInput.addEventListener("input", function () {
    var value = parseInt(customInput.value.replace(/\D/g, ""), 10);

    if (value > 0) {
      selectedDonationAmount = value;
      setSelectedAmountButton(-1);
      updateDonateButtonLabel();
    }
  });
}

function initFrequencyToggle() {
  var onceBtn = document.getElementById("toggle_once_off");
  var monthlyBtn = document.getElementById("toggle_monthly");

  if (!onceBtn || !monthlyBtn) {
    return;
  }

  onceBtn.addEventListener("click", function () {
    isMonthlyDonation = false;
    onceBtn.classList.add("is-active");
    monthlyBtn.classList.remove("is-active");
    updateDonateButtonLabel();
  });

  monthlyBtn.addEventListener("click", function () {
    isMonthlyDonation = true;
    monthlyBtn.classList.add("is-active");
    onceBtn.classList.remove("is-active");
    updateDonateButtonLabel();
  });
}

function handleYocoDonationSubmit(event) {
  event.preventDefault();

  var nameInput = document.getElementById("donor_name_input");
  var emailInput = document.getElementById("donor_email_input");
  var statusEl = document.getElementById("donate_status_message");

  var donorName = nameInput ? nameInput.value.trim() : "";
  var donorEmail = emailInput ? emailInput.value.trim() : "";

  if (!donorName || !donorEmail) {
    showStatusMessage(statusEl, "Please enter your name and email.", true);
    return;
  }

  if (statusEl) {
    statusEl.classList.remove("is-visible");
  }

  toggleProcessingOverlay(true);

  var description = isMonthlyDonation
    ? "Monthly R" + selectedDonationAmount + " donation \u2014 Zuko Tisani Youth Leadership Foundation"
    : "Donate R" + selectedDonationAmount + " \u2014 Zuko Tisani Youth Leadership Foundation";

  fetch(YOCO_CHARGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountInCents: selectedDonationAmount * 100,
      name: donorName,
      email: donorEmail,
      description: description
    })
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toggleProcessingOverlay(false);
        showStatusMessage(statusEl, data.error || "Could not start payment. Please try again.", true);
      }
    })
    .catch(function () {
      toggleProcessingOverlay(false);
      showStatusMessage(statusEl, "Network error. Please try again.", true);
    });
}

function checkPaymentRedirectResult() {
  var params = new URLSearchParams(window.location.search);
  var paymentResult = params.get("payment");
  var statusEl = document.getElementById("donate_status_message");
  var successPanel = document.getElementById("donate_success_panel");
  var formPanel = document.getElementById("donate_form_panel");

  if (!paymentResult) {
    return;
  }

  if (paymentResult === "success") {
    if (successPanel && formPanel) {
      formPanel.classList.add("form-panel-card-hidden");
      successPanel.classList.remove("form-panel-card-hidden");
    }
  } else {
    var message = paymentResult === "cancelled" ? "Payment was cancelled." : "Payment failed. Please try again.";
    showStatusMessage(statusEl, message, true);
  }

  window.history.replaceState({}, "", window.location.pathname);
}

function buildEmailBodyFromForm(formEl, sectionTitle) {
  var body = "--- " + sectionTitle.toUpperCase() + " ---\n";
  var fields = formEl.querySelectorAll("[data-field-label]");

  fields.forEach(function (field) {
    var label = field.getAttribute("data-field-label");
    var value = field.value && field.value.trim() ? field.value.trim() : "\u2014";
    body += label + ": " + value + "\n";
  });

  return body;
}

function initSubmitProjectForm() {
  var form = document.getElementById("submit_project_form");

  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var statusEl = document.getElementById("project_status_message");
    var submitBtn = document.getElementById("project_submit_btn");
    var nameInput = document.getElementById("project_full_name");
    var emailInput = document.getElementById("project_email");

    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      showStatusMessage(statusEl, "Please complete your name and email.", true);
      return;
    }

    submitBtn.textContent = "SUBMITTING\u2026";
    submitBtn.disabled = true;

    var templateParams = {
      name: nameInput.value.trim(),
      title: "Project Submission \u2014 " + nameInput.value.trim(),
      time: new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
      email: emailInput.value.trim(),
      message: buildEmailBodyFromForm(form, "Project Submission")
    };

    window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, { publicKey: EMAILJS_PUBLIC_KEY })
      .then(function () {
        showStatusMessage(statusEl, "Application received \u2014 we'll be in touch within 4\u20136 weeks.", false);
        form.reset();
        submitBtn.textContent = "SUBMIT APPLICATION";
        submitBtn.disabled = false;
      })
      .catch(function (err) {
        var message = err && err.message ? err.message : "Something went wrong. Please try again.";
        showStatusMessage(statusEl, message, true);
        submitBtn.textContent = "SUBMIT APPLICATION";
        submitBtn.disabled = false;
      });
  });
}

function initTaxCertificateForm() {
  var form = document.getElementById("tax_certificate_form");

  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var statusEl = document.getElementById("tax_status_message");
    var submitBtn = document.getElementById("tax_submit_btn");
    var nameInput = document.getElementById("tax_full_name");
    var emailInput = document.getElementById("tax_email");

    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      showStatusMessage(statusEl, "Please complete your name and email.", true);
      return;
    }

    submitBtn.textContent = "SENDING\u2026";
    submitBtn.disabled = true;

    var templateParams = {
      name: nameInput.value.trim(),
      title: "Section 18A Certificate Request \u2014 " + nameInput.value.trim(),
      time: new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
      email: emailInput.value.trim(),
      message: buildEmailBodyFromForm(form, "Tax Certificate Request")
    };

    window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, { publicKey: EMAILJS_PUBLIC_KEY })
      .then(function () {
        showStatusMessage(statusEl, "Request received \u2014 your certificate will be emailed within 48 hours.", false);
        form.reset();
        submitBtn.textContent = "REQUEST CERTIFICATE";
        submitBtn.disabled = false;
      })
      .catch(function (err) {
        var message = err && err.message ? err.message : "Something went wrong. Please try again.";
        showStatusMessage(statusEl, message, true);
        submitBtn.textContent = "REQUEST CERTIFICATE";
        submitBtn.disabled = false;
      });
  });
}

function initDonateForm() {
  var donateForm = document.getElementById("donate_form");

  if (!donateForm) {
    return;
  }

  initDonateAmountButtons();
  initCustomAmountInput();
  initFrequencyToggle();
  updateDonateButtonLabel();
  donateForm.addEventListener("submit", handleYocoDonationSubmit);
  checkPaymentRedirectResult();
}

function getElementGap(trackEl) {
  var computed = window.getComputedStyle(trackEl);
  var gapValue = computed.columnGap || computed.gap || "0";
  return parseFloat(gapValue) || 0;
}

function getCarouselLoopWidth(originalSlides, track) {
  var gap = getElementGap(track);
  var total = 0;

  originalSlides.forEach(function (slide) {
    total += slide.getBoundingClientRect().width + gap;
  });

  return total;
}

function initCarousel(rootEl) {
  var viewport = rootEl.querySelector(".carousel-viewport");
  var track = rootEl.querySelector(".carousel-track");
  var prevBtn = rootEl.querySelector(".carousel-prev-btn");
  var nextBtn = rootEl.querySelector(".carousel-next-btn");

  if (!viewport || !track) {
    return;
  }

  var originalSlides = Array.prototype.slice.call(track.children);

  originalSlides.forEach(function (slide) {
    var clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  var pixelsPerSecond = 34;
  var scrollPosition = 0;
  var isPaused = false;
  var lastFrameTime = null;

  function slideStepWidth() {
    return originalSlides[0].getBoundingClientRect().width + getElementGap(track);
  }

  function renderFrame(timestamp) {
    if (lastFrameTime === null) {
      lastFrameTime = timestamp;
    }

    var deltaSeconds = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    if (!isPaused) {
      scrollPosition += pixelsPerSecond * deltaSeconds;
    }

    var loopWidth = getCarouselLoopWidth(originalSlides, track);

    if (loopWidth > 0) {
      scrollPosition = ((scrollPosition % loopWidth) + loopWidth) % loopWidth;
    }

    track.style.transform = "translateX(-" + scrollPosition + "px)";
    requestAnimationFrame(renderFrame);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      scrollPosition += slideStepWidth();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      scrollPosition -= slideStepWidth();
    });
  }

  viewport.addEventListener("mouseenter", function () {
    isPaused = true;
  });

  viewport.addEventListener("mouseleave", function () {
    isPaused = false;
  });

  requestAnimationFrame(renderFrame);
}

function initAllCarousels() {
  var carousels = document.querySelectorAll(".carousel-block");

  carousels.forEach(function (rootEl) {
    initCarousel(rootEl);
  });
}

function scrollToHashTarget(hash) {
  var target = document.querySelector(hash);

  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

function initSmoothHashNavigation() {
  var currentPage = window.location.pathname.split("/").pop();
  var hashLinks = document.querySelectorAll('a[href*="#"]');

  hashLinks.forEach(function (link) {
    var href = link.getAttribute("href");
    var hashIndex = href.indexOf("#");

    if (hashIndex === -1) {
      return;
    }

    var pagePart = href.substring(0, hashIndex);
    var hashPart = href.substring(hashIndex);
    var isSamePage = pagePart === "" || pagePart === currentPage;

    if (isSamePage && document.querySelector(hashPart)) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        scrollToHashTarget(hashPart);
      });
    }
  });

  if (window.location.hash) {
    window.scrollTo(0, 0);
    setTimeout(function () {
      scrollToHashTarget(window.location.hash);
    }, 80);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initMobileNav();
  initDonateForm();
  initSubmitProjectForm();
  initTaxCertificateForm();
  initAllCarousels();
  initSmoothHashNavigation();
});
