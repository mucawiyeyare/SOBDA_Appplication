import Contact from "../models/contactModel.js";

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public
export const createMessage = async (req, res) => {
  try {
    const { fullName, email, phone, carrier, carrierCode, formattedPhone, subject, message, urgency, attachments } = req.body;

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const newMessage = new Contact({
      fullName,
      email,
      phone,
      carrier: carrier || "Hormuud",
      carrierCode: carrierCode || "+252 61",
      formattedPhone: formattedPhone || (phone ? `${carrierCode || "+252 61"} ${phone}` : ""),
      subject,
      message,
      urgency: urgency || "Normal",
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const savedMessage = await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: savedMessage
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Admin only)
export const getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/contact/:id
// @access  Private (Admin only)
export const deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.deleteOne();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
