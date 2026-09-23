import ActivityLog from "../models/activityLogModel.js";

// @desc    Create a log entry (Internal use)
export const createLog = async (userId, action, type = "system", status = "success", details = "") => {
  try {
    const log = new ActivityLog({
      user: userId,
      action,
      type,
      status,
      details
    });
    await log.save();
    console.log(`[Activity Log] ${action}`);
  } catch (error) {
    console.error("Error creating activity log:", error);
  }
};

// @desc    Get recent activity logs
// @route   GET /api/activity
// @access  Private
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const role = req.user.role;

    let filter = {};

    // Donors/Hospitals only see their own activity or relevant info
    if (role === "donor" || role === "hospital") {
      filter = { user: req.user._id };
    } 
    // Admins see everything
    // Health Institutions see everything (assuming oversight role)

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "name role");

    res.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
