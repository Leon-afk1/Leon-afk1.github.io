# Léon Morales - AI Engineer Portfolio

This repository contains the source code for my personal portfolio website. As an AI Engineering student specializing in Machine Learning and Deep Learning, this site serves as a central hub to showcase my skills, projects, and professional experience, primarily aimed at securing internship opportunities in the AI field.

**Live Demo:** [https://leon-afk1.github.io](https://leon-afk1.github.io)

---

## Features

* **Responsive Design:** Adapts to various screen sizes (desktops, tablets, mobiles).
* **Bilingual Content:** Supports both English and French, loaded dynamically from a JSON file (`texte.json`). Language preference is saved using `localStorage`.
* **Dark/Light Theme:** Includes a theme toggle switch, also saving user preference via `localStorage`.
* **Interactive MNIST Demo:** Features a canvas where users can draw digits (0-9). A pre-trained PyTorch Convolutional Neural Network (CNN) model, exported to ONNX format, runs directly in the browser using ONNX Runtime Web to predict the drawn digit. Includes pre-processing visualization.
* **Smooth Scrolling & Active Navigation:** Implements smooth scrolling for internal links and highlights the active section in the navigation bar.
* **Dynamic Content Loading:** Page text is managed through a JSON structure for easy updates and internationalization.
* **CSS Animations:** Subtle animations on scroll (using `IntersectionObserver`) and hover effects enhance user experience.
* **Contact Form:** Integrated contact form using Formspree (or similar backend service) for handling submissions reliably.
* **Internship Reports:** Includes detailed reports (in English and French) from my internship at Ksilink, providing in-depth insights into the projects mentioned. 

---

## Technologies Used

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **AI Model Integration:**
    * [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/): To run the MNIST model inference directly in the browser.
    * PyTorch: Used for training the original MNIST model (model exported to ONNX format - `mnist_model.onnx`).
* **JavaScript APIs:**
    * `fetch` API: For loading language translations from JSON.
    * `localStorage`: For storing theme and language preferences.
    * `IntersectionObserver`: For triggering animations on scroll.
    * Canvas API: For the MNIST drawing interface.
* **Fonts:** Google Fonts (Inter)
* **Deployment:** GitHub page

---

## 📂 Internship Reports

For a detailed understanding of my contributions and the projects undertaken during my internship at **Ksilink** (Sept 2024 - Feb 2025), please refer to the internship reports included in this repository:

* `./internship-report-en.pdf.pdf` 
* `./internship-report-en.pdf.pdf` 

These reports cover the implementation details of the Multimodal Contrastive Learning model, the LLM-based Chatbot, and the Cell Classification CNN project.

---

## 📫 Contact

* **Email:** [leon.morales@utbm.fr](mailto:leon.morales@utbm.fr)
* **LinkedIn:** [https://www.linkedin.com/in/léon-morales](https://www.linkedin.com/in/léon-morales) 
* **GitHub:** [https://github.com/Leon-afk1](https://github.com/Leon-afk1) 

---

