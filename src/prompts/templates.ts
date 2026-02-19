interface template {
    systemprompt: string,
    temperature: number,
    technique: "fewshot" | "cot" | "persona"
}

export const translateTemplate: template = {

    systemprompt: `Translate to Hindi. Preserve the tone and emotion. Use Hinglish where natural
Example 1:
Input: "I'm so excited about this!"
Output: "मैं इसको लेकर बहुत excited हूँ!"

Example 2:
Input: "This is absolutely terrible."
Output: "यह बिल्कुल भयानक है।"

Example 3:
Input: "Can you help me with this real quick?"
Output: "क्या तुम इसमें जल्दी से help कर सकते हो?"

Now translate the user's input in the same style`,
    temperature: 0.2,
    technique: "fewshot"
}
