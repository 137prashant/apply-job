// emailTemplate.js

function capitalizeName(name) {
  if (!name) return null;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function resolveCompany(company) {
  if (!company || company.trim() === '') return null;
  return company.trim();
}

function buildContactFooter({ phone, linkedin, portfolio, github, forPreview }) {
  const imgSrc = (cid, file) => (forPreview ? `/${file}` : `cid:${cid}`);

  return `
        <div style="margin-top: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${imgSrc('mobile', 'mobile.png')}" style="width: 24px; height: 24px; margin-right: 12px;" alt="Mobile" />
            <span style="color: #333; font-size: 14px;">${phone}</span>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${imgSrc('linkedin', 'linkedin.png')}" style="width: 24px; height: 24px; margin-right: 12px;" alt="LinkedIn" />
            <a href="${linkedin}" style="color: #0077B5; text-decoration: underline; font-size: 14px;">LinkedIn</a>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${imgSrc('portfolio', 'portfolio.png')}" style="width: 24px; height: 24px; margin-right: 12px;" alt="Portfolio" />
            <a href="${portfolio}" style="color: #1E40AF; text-decoration: underline; font-size: 14px;">Portfolio</a>
          </div>

          <div style="display: flex; align-items: center;">
            <img src="${imgSrc('github', 'github.png')}" style="width: 24px; height: 24px; margin-right: 12px;" alt="GitHub" />
            <a href="${github}" style="color: #333; text-decoration: underline; font-size: 14px;">GitHub</a>
          </div>
        </div>`;
}

function buildEmailContent(opts) {
  const {
    name = null,
    company = null,
    myName = 'Prashant Singh',
    phone = '+91 9504334245',
    linkedin = 'https://www.linkedin.com/in/prashantuff/',
    portfolio = 'https://prashant-137prashants-projects.vercel.app/',
    github = 'https://github.com/137prashant',
    title = 'Frontend Developer',
    forPreview = false,
  } = opts;

  const recipientName = name && name.trim() !== '' ? capitalizeName(name) : null;
  const greeting = recipientName ? `Dear ${recipientName},` : 'Dear Hiring Manager,';
  const companyName = resolveCompany(company);
  const subject = companyName
    ? `Application for ${title} – ${companyName}`
    : `Application for ${title}`;

  const roleIntroHtml = companyName
    ? `I am excited to apply for the <strong>${title}</strong> role at ${companyName}.`
    : `I am excited to apply for the <strong>${title}</strong> role.`;

  const roleIntroText = companyName
    ? `I am excited to apply for the ${title} role at ${companyName}.`
    : `I am excited to apply for the ${title} role.`;

  const paragraph1Html = `${roleIntroHtml} With <strong>2+ years</strong> of experience, I have worked with <strong>React.js</strong>, <strong>Next.js</strong>, <strong>Tailwind CSS</strong>, <strong>Material UI</strong>, <strong>Redux</strong>, <strong>JavaScript (ES6+)</strong>, <strong>HTML5</strong>, and <strong>CSS3</strong>, along with proficiency in <strong>RESTful APIs</strong>, <strong>Git</strong>, and <strong>Node.js</strong>.`;

  const paragraph1Text = `${roleIntroText} With 2+ years of experience, I have worked with React.js, Next.js, Tailwind CSS, Material UI, Redux, JavaScript (ES6+), HTML5, and CSS3, along with proficiency in RESTful APIs, Git, and Node.js.`;

  const paragraph2Html =
    'I am passionate about building <strong>scalable</strong>, <strong>user-friendly</strong> web applications with expertise in <strong>responsive UI</strong>, <strong>API integrations</strong>, and performance <strong>optimization</strong>.';

  const paragraph2Text =
    'I am passionate about building scalable, user-friendly web applications with expertise in responsive UI, API integrations, and performance optimization.';

  const paragraph3Html =
    "I have collaborated with <strong>backend</strong> and <strong>design teams</strong> to deliver <strong>pixel-perfect</strong>, data-driven solutions. As an <strong>immediate joiner</strong>, I look forward to discussing how my skills can contribute to your team's success.";

  const paragraph3Text =
    "I have collaborated with backend and design teams to deliver pixel-perfect, data-driven solutions. As an immediate joiner, I look forward to discussing how my skills can contribute to your team's success.";

  const paragraph4 = 'Looking forward to your response.';

  const contactFooter = buildContactFooter({
    phone,
    linkedin,
    portfolio,
    github,
    forPreview,
  });

  const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #111;">
        <p><strong>${greeting}</strong></p>

        <p>${paragraph1Html}</p>

        <p>${paragraph2Html}</p>

        <p>${paragraph3Html}</p>

        <p>${paragraph4}</p>

        <p>Best regards,<br/>
        <strong>${myName}</strong></p>

        ${contactFooter}
      </div>
    `;

  const textBody = `
${greeting}

${paragraph1Text}

${paragraph2Text}

${paragraph3Text}

${paragraph4}

Best regards,
${myName}

📞 ${phone}
🔗 LinkedIn: ${linkedin}
🌐 Portfolio: ${portfolio}
💻 GitHub: ${github}
    `.trim();

  return { subject, greeting, htmlBody, textBody };
}

/**
 * Safe: accepts null/undefined and still uses defaults.
 * Usage: generateEmailTemplate(null) or generateEmailTemplate({ name: 'Foo' })
 */
export function generateEmailTemplate(arg) {
  const opts = arg == null ? {} : arg;
  return buildEmailContent(opts);
}

export function generatePreviewTemplate(arg) {
  const opts = arg == null ? {} : arg;
  return buildEmailContent({ ...opts, forPreview: true }).htmlBody;
}
