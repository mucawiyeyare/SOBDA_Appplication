import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Edit, Shield, Search, Filter, X, Users as UsersIcon, Droplet, Mail, Phone, MapPin, Save, User as UserIcon, Calendar, CheckCircle } from "lucide-react";

function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bloodType: "",
    role: "",
    isAvailable: true,
  });

  // Get unique locations from users
  const [locations, setLocations] = useState([]);
  
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const roles = ["admin", "donor", "hospital", "health_institution", "doctor"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const res = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
      
      // Extract unique locations
      const uniqueLocations = [...new Set(res.data.map(u => u.location).filter(Boolean))];
      setLocations(uniqueLocations);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("User deleted successfully");
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      location: user.location || "",
      bloodType: user.bloodType || "",
      role: user.role,
      isAvailable: user.isAvailable !== undefined ? user.isAvailable : true,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/update-user/${editingUser._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("User updated successfully");
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  // Filter users whenever search criteria changes
  useEffect(() => {
    let filtered = users;

    // Filter by search term (name or email)
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by blood type
    if (selectedBloodType) {
      filtered = filtered.filter(user => user.bloodType === selectedBloodType);
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(user => user.location === selectedLocation);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole, selectedBloodType, selectedLocation, users]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
    setSelectedBloodType("");
    setSelectedLocation("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border-l-4 border-red-600 text-red-700 p-6 rounded-lg shadow-xl max-w-md">
          <strong className="font-bold text-lg">Error:</strong>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-8 h-8 text-red-600" />
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all registered users, donors, and admins.
              </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 font-semibold text-sm">
                 Total Users: {users.length}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all border ${
                  showFilters ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } w-full lg:w-auto`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              {(searchTerm || selectedRole || selectedBloodType || selectedLocation) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all w-full lg:w-auto"
                >
                  <X className="w-5 h-5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Options (Collapsible) */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-gray-100 animate-fadeIn">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Blood Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedBloodType}
                    onChange={(e) => setSelectedBloodType(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
                  >
                    <option value="">All Blood Types</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                       <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                       <p className="text-gray-500 font-medium">No users found matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold border border-red-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            user.role === 'health_institution' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            user.role === 'hospital' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            user.role === 'doctor' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {user.role === 'health_institution' ? 'MINISTRY / HEALTH INST' : user.role ? user.role.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-2">
                           <Phone className="w-3 h-3 text-gray-400" />
                           {user.phone || "-"}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                           <MapPin className="w-3 h-3 text-gray-400" />
                           {user.location || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-50 text-red-700">
                           {user.bloodType || "-"}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination (Placeholder style) */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
             <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} results
             </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-red-600" />
                  Edit User Details
               </h3>
               <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                     <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                           type="text"
                           required
                           value={editForm.name}
                           onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                     </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                           type="email"
                           required
                           value={editForm.email}
                           onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                     </div>
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                     <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                           type="text"
                           required
                           value={editForm.phone}
                           onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                     </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                           type="text"
                           required
                           value={editForm.location}
                           onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                     </div>
                  </div>

                  {/* Blood Type */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                     <div className="relative">
                        <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                           value={editForm.bloodType}
                           onChange={(e) => setEditForm({...editForm, bloodType: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white font-medium"
                        >
                           <option value="">Select Blood Type</option>
                           {bloodTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                     <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                           value={editForm.role}
                           onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white font-medium"
                        >
                           {roles.map((role) => (
                              <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                           ))}
                        </select>
                     </div>
                  </div>
                  
                  {/* Availability (Optional based on role but good to have) */}
                  {(editForm.role === 'donor') && (
                      <div className="col-span-2">
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.isAvailable}
                                onChange={(e) => setEditForm({...editForm, isAvailable: e.target.checked})}
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Available to Donate</span>
                                <span className="text-xs text-gray-500">Uncheck if donor is temporarily unavailable</span>
                            </div>
                        </label>
                      </div>
                  )}
               </div>

               <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                     type="button"
                     onClick={() => setShowEditModal(false)}
                     className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                     <Save className="w-4 h-4" />
                     Save Changes
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
