/* Port of the original khmer_texts.js */
import { generateRandomTexts } from './khmerWords'

function getRandomText(): string {
    const texts = generateRandomTexts(1, 15, 25)
    return texts[0]
}

export { getRandomText }
