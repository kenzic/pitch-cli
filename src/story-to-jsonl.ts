type Message = {
    role: string;
    content: string;
};

const storyToJsonl = (plainText: string): string[] => {
    const lines = plainText.trim().split('\n');
    let currentConversation: Message[] = [];
    const output: string[] = [];

    let currentRole = '';
    let currentContent = '';

    for (const line of lines) {
        if (line === '---') {
            if (currentRole) {
                currentConversation.push({
                    role: currentRole,
                    content: currentContent.trim()
                });
                currentRole = '';
                currentContent = '';
            }
            if (currentConversation.length > 0) {
                output.push(JSON.stringify({
                    messages: currentConversation
                }));
                currentConversation = [];
            }
        } else if (/^(User|Assistant|System):/.test(line)) {
            if (currentRole) {
                currentConversation.push({
                    role: currentRole,
                    content: currentContent.trim()
                });
            }
            const [role, ...contentArr] = line.split(':');
            currentRole = role.toLowerCase();
            currentContent = contentArr.join(':').trim();
        } else {
            currentContent += (currentContent ? '\n' : '') + line.trim();
        }
    }

    // Add the last message and conversation if they're not empty
    if (currentRole) {
        currentConversation.push({
            role: currentRole,
            content: currentContent.trim()
        });
    }
    if (currentConversation.length > 0) {
        output.push(JSON.stringify({ messages: currentConversation }));
    }

    return output;
};

export default storyToJsonl;
