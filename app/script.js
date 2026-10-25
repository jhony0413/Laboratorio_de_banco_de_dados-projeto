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
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (currentMode === "login") {
      const login = document.querySelector("#login").value.trim();
      const senha = document.querySelector("#password").value.trim();
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, senha })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("sgl_vendedor", JSON.stringify(data.vendedor));
          window.location.href = "dashboard.html";
        } else {
          alert(data.error || "Usuário ou senha inválidos.");
        }
      } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao conectar com o servidor.");
      }
    } else {
      // MODO REGISTRO (Criar conta)
      const nome = document.querySelector("#name").value.trim();
      const cpf = document.querySelector("#cpf").value.trim();
      const email = document.querySelector("#email").value.trim();
      const telefone = document.querySelector("#phone").value.trim();
      const login = document.querySelector("#login").value.trim();
      const senha = document.querySelector("#password").value.trim();
      const confirmarSenha = document.querySelector("#confirm-password").value.trim();
      if (!nome || !cpf || !email || !login || !senha) {
        alert("Preencha todos os campos obrigatórios!");
        return;
      }
      if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/api/cadastrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, cpf, email, telefone, login, senha })
        });
        const data = await response.json();
        if (response.ok) {
          alert("Conta criada com sucesso! Faça login para continuar.");
          // Alterna de volta para a aba de login
          setMode("login");
        } else {
          alert(data.error || "Erro ao criar conta.");
        }
      } catch (error) {
        console.error("Erro no cadastro:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  });
}
setMode("login");