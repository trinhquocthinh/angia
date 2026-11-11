// Kiểm nội dung chuỗi/JSX để không báo màu trong chú thích.
export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: { token: 'Dùng token trong shared/styles/tokens.css thay cho màu cứng.' },
  },
  create(context) {
    const pattern =
      /(?:#|%23)(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])|(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(|\b(?:bg|text|border(?:-[trblxy])?|outline|ring|fill|stroke|from|via|to|shadow|accent|divide|placeholder|decoration)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)\b/i;
    const check = (node) => {
      if (pattern.test(context.sourceCode.getText(node))) context.report({ node, messageId: 'token' });
    };
    return { Literal: check, TemplateElement: check, JSXText: check };
  },
};
