/**
 * @typedef {Object} Share
 * @property {string} id - Unique ID for the share (usually index 1-7)
 * @property {string} customerName - Name of the customer
 * @property {string} customerPhone - Phone number
 * @property {number} paidAmount - Amount paid so far
 * @property {boolean} isSold - Whether this share is taken
 */

/**
 * @typedef {Object} Animal
 * @property {string} id - Firestore Document ID
 * @property {string} type - 'buyukbas' | 'kucukbas'
 * @property {string} name - e.g. "2. Büyükbaş" or Ear Tag No
 * @property {string} photoUrl - Cover photo URL
 * @property {string[]} additionalPhotos - Array of other photo URLs
 * @property {number} totalPrice - Total price of the animal
 * @property {number} totalShares - Total number of shares (default 7 for cattle)
 * @property {number} soldShares - Count of sold shares
 * @property {Share[]} shares - List of share details
 * @property {Object} createdAt - Firestore Timestamp
 */
