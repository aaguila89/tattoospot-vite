import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

async function createNotification({ userId, type, title, message, bookingId }) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      message,
      bookingId: bookingId || null,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export async function notifyArtistNewBooking({ artistId, clientName, bookingId }) {
  await createNotification({
    userId: artistId,
    type: "new_booking",
    title: "New booking request",
    message: `${clientName} wants to book an appointment with you.`,
    bookingId,
  });
}

export async function notifyClientAccepted({ clientId, artistName, bookingId }) {
  await createNotification({
    userId: clientId,
    type: "accepted",
    title: "Booking accepted!",
    message: `${artistName} accepted your request. Pay your deposit to confirm.`,
    bookingId,
  });
}

export async function notifyClientDeclined({ clientId, artistName, bookingId }) {
  await createNotification({
    userId: clientId,
    type: "declined",
    title: "Booking declined",
    message: `${artistName} wasn't able to take your booking this time.`,
    bookingId,
  });
}

export async function notifyArtistDepositPaid({ artistId, clientName, depositAmount, bookingId }) {
  await createNotification({
    userId: artistId,
    type: "confirmed",
    title: "Deposit received!",
    message: `${clientName} paid a $${depositAmount} deposit. Your booking is confirmed.`,
    bookingId,
  });
}