"use strict";

const form = document.querySelector("#auth-form");
const tabs = [...document.querySelectorAll(".mode-button")];
const registerFields = [...document.querySelectorAll(".register-only")];
const title = document.querySelector("#form-title");
const eyebrow = document.querySelector("#form-eyebrow");
const subtitle = document.querySelector("#form-subtitle");
const submitLabel = document.querySelector("#submit-label");
const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
const cpfInput = document.querySelector("#cpf");

let currentMode = "login";

function setMode(mode) {
  currentMode = mode;
  const isRegister = mode === "register";

  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  registerFields.forEach((element) => {
    element.hidden = !isRegister;
  });

  title.textContent = isRegister ? "Criar conta de vendedor" : "Entrar na sua conta";
  eyebrow.textContent = isRegister ? "COMECE POR AQUI" : "BEM-VINDO DE VOLTA";
  subtitle.textContent = isRegister
    ? "Preencha os dados para solicitar seu cadastro."
    : "Informe seus dados para acessar o painel.";
  submitLabel.textContent = isRegister ? "Criar conta" : "Entrar";
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
}

tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.textContent = showing ? "Mostrar" : "Ocultar";
    togglePassword.setAttribute("aria-pressed", String(!showing));
  });
}

if (cpfInput) {
  cpfInput.addEventListener("input", () => {
    const digits = cpfInput.value.replace(/\D/g, "").slice(0, 11);
    cpfInput.value = digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (currentMode === "login") {
      window.location.href = "dashboard.html";
    } else {
    }
  });
}

setMode("login");