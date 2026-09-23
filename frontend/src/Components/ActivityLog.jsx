import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, Users, Droplet, UserPlus, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/activity?limit=50", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "user":
        return <Users className="w-5 h-5" />;
      case "donation":
        return <Droplet className="w-5 h-5" />;
      case "report":
        return <FileText className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-600";
      case "donation":
        return "bg-red-100 text-red-600";
      case "report":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Log</h1>
        <p className="text-gray-600">Track all system activities and events</p>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 font-medium">Total Activities</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{activities.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 font-medium">Successful</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{activities.filter(a => a.status === 'success').length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 font-medium">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{activities.filter(a => a.status === 'pending').length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-gray-600 font-medium">Failed</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{activities.filter(a => a.status === 'error').length}</p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activities</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`${getTypeColor(activity.type)} p-3 rounded-full`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-600">
                   {/* Handle optional user */}
                   {activity.user ? 
                      <>by <span className="font-medium">{activity.user.name}</span> • </> 
                      : ''}
                   {new Date(activity.createdAt).toLocaleString()}
                </p>
                {activity.details && <p className="text-xs text-gray-500 mt-1">{activity.details}</p>}
              </div>
              <div>{getStatusIcon(activity.status)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivityLog;
