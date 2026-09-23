import React, { useEffect, useState } from "react";
import { Smartphone, Trash2, ShieldCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";
import { deviceLabelFromUserAgent } from "../utils/deviceLabel.js";

export default function NotificationDevices() {
  const { listMyDevices, revokeDevice, getCurrentDeviceEndpoint } = useNotifications();
  const [devices, setDevices] = useState([]);
  const [currentEndpoint, setCurrentEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [devicesRes, endpoint] = await Promise.all([
      listMyDevices(),
      getCurrentDeviceEndpoint(),
    ]);
    if (devicesRes.success) {
      setDevices(devicesRes.devices);
      setError("");
    } else {
      setError(devicesRes.message || "Failed to load devices");
    }
    setCurrentEndpoint(endpoint);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (device) => {
    const isThisDevice = device.endpoint === currentEndpoint;
    if (
      !window.confirm(
        isThisDevice
          ? "This is the device you're using right now. Remove it anyway? You'll stop getting push alerts here."
          : "Remove this device? It will stop receiving push notifications."
      )
    ) {
      return;
    }

    setRemovingId(device._id);
    const res = await revokeDevice(device._id);
    if (res.success) {
      setDevices((prev) => prev.filter((d) => d._id !== device._id));
    } else {
      alert(res.message || "Failed to remove device");
    }
    setRemovingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-black text-slate-800">Notification Devices</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Every phone, laptop, or tablet where you enabled push alerts. Remove any device you no
        longer use.
      </p>

      {loading ? (
        <p className="text-sm text-slate-400 py-4">Loading devices…</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : devices.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">
          No devices registered yet. Enable notifications from the banner at the top of your
          dashboard to register this device.
        </p>
      ) : (
        <div className="space-y-2.5">
          {devices.map((device) => {
            const isThisDevice = device.endpoint === currentEndpoint;
            return (
              <div
                key={device._id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {deviceLabelFromUserAgent(device.userAgent)}
                    </p>
                    {isThisDevice && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3" />
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Added {new Date(device.createdAt).toLocaleDateString()} · Last active{" "}
                    {new Date(device.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(device)}
                  disabled={removingId === device._id}
                  className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  aria-label="Remove device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
