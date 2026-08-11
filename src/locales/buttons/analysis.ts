export const analysis = {

    result_title: `🔎 <b>Your PDF is ready</b>\n` +
    `━━━━━━━━━━━━━━━━━━`,

    field_name: `📄 <b>File:</b> {{name}}`,
    field_size: `💾 <b>Size:</b> {{size}}`,
    field_pages: `📑 <b>Pages:</b> {{pages}}`,
    field_author: `👤 <b>Author:</b> {{author}}`,
    field_encrypted: `🔐 <b>Password protected:</b> {{encrypted}}`,
    field_type: `📦 <b>File type:</b> {{type}}`,

    field_actions: `⚙️ <b>What can you do next?</b>\n` +
    `🗜 Compress: {{compress}}\n` +
    `✂️ Split pages: {{split}}\n` +
    `🔗 Merge with other PDFs: {{merge}}\n` +
    `🧹 Remove metadata: {{meta}}`,

    type_scanned:  `📸 <b>Scanned PDF (Images only)</b>`,
    type_standard: `📝 <b>Text PDF (Text + Images)</b>`,
    type_vector:   `📐 <b>Vector PDF (Drawings)</b>`,

    val_yes: `✅ Yes`,
    val_no: `❌ No`,
    val_scanned: `📸 Already a scanned PDF`,
    val_reason: `❌ No — {{reason}}`,

    processing: `🔍 <b>Analyzing your PDF...</b>\n\n` +
    `Checking the file and preparing available actions.`,

    success: `✅ <b>Your PDF is ready.</b>\n\n` +
    `📄 <b>File:</b> {{name}}\n` +
    `💾 <b>Size:</b> {{size}} MB\n` +
    `📑 <b>Pages:</b> {{pages}}\n` +
    `🔐 <b>Password protected:</b> {{protected}}\n\n` +
    `👇 <i>Choose what you'd like to do next.</i>`,

    encrypted: `🔒 <b>This PDF is password protected.</b>\n\n` +
    `I can't process it until it's unlocked.\n\n` +
    `👇 <i>Select <b>Unlock</b> to remove the password.</i>`,

    corrupt: `❌ <b>I couldn't read this PDF.</b>\n\n` +
    `The file appears to be damaged or has an invalid PDF structure.`,

} as const;
