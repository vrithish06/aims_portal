import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import { Trash2, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function AlertManager() {
    const { user } = useAuthStore();
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    // Fetch admin's alerts
    // Fetch admin's alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                setLoading(true);
                // Fetch all alerts from backend (public endpoint, but we filter in UI or backend usually returns all)
                // Actually, the requirement was "only see their own posts". 
                // The backend endpoint GET /alerts returns ALL alerts currently.
                // We should probably filter on the frontend for now since the backend just does a select *
                // OR better, we can just show all alerts to admins? 
                // The requirement: "Ensure the admin's alerts list is fetched using select().eq('admin_id', user.id) so they only see and manage their own posts."

                // Since I implemented GET /alerts as public and generic, I will filter here on the client side for now to match requirement strictly,
                // merging logic with the new backend approach.
                const response = await axiosClient.get('/alerts');

                if (response.data?.success) {
                    const allAlerts = response.data.data || [];
                    // Filter for current admin
                    const myAlerts = allAlerts.filter(a => String(a.admin_id) === String(user.user_id));
                    setAlerts(myAlerts);
                }
            } catch (error) {
                console.error('Error fetching alerts:', error);
                toast.error('Failed to load your alerts');
            } finally {
                setLoading(false);
            }
        };

        if (user?.user_id) {
            fetchAlerts();
        }
    }, [user?.user_id]);

    const handlePostAlert = async (e) => {
        e.preventDefault();
        if (!newAlert.trim()) return;

        try {
            setPosting(true);
            const response = await axiosClient.post('/alerts', {
                content: newAlert
            });

            if (response.data?.success) {
                toast.success('Alert posted successfully');
                setNewAlert('');

                // Optimistically add or re-fetch
                // The response contains the new alert data
                const newAlertData = response.data.data;
                if (newAlertData) {
                    setAlerts([newAlertData, ...alerts]);
                }
            }
        } catch (error) {
            console.error('Error posting alert:', error);
            toast.error('Failed to post alert');
        } finally {
            setPosting(false);
        }
    };

    const handleDeleteAlert = async (id) => {
        try {
            // Optimistic update
            const previousAlerts = [...alerts];
            setAlerts(alerts.filter(alert => alert.id !== id));

            const response = await axiosClient.delete(`/alerts/${id}`);

            if (!response.data?.success) {
                // Revert if failed
                setAlerts(previousAlerts);
                throw new Error(response.data?.message || 'Failed to delete');
            }
            toast.success('Alert deleted');
        } catch (error) {
            console.error('Error deleting alert:', error);
            toast.error('Failed to delete alert');
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* The Creator */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Send className="w-6 h-6 text-blue-600" />
                    Post New Alert
                </h2>
                <form onSubmit={handlePostAlert} className="space-y-4">
                    <textarea
                        value={newAlert}
                        onChange={(e) => setNewAlert(e.target.value)}
                        placeholder="Type your important announcement here..."
                        className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none h-32"
                        disabled={posting}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={posting || !newAlert.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {posting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    Post Alert
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* The List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-indigo-600" />
                    Your Active Alerts
                </h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p>No alerts found. Post one above!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {alerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex-1">
                                        <p className="text-gray-800 font-medium whitespace-pre-wrap">{alert.content}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Posted on {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAlert(alert.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 group-hover:opacity-100 opacity-100 md:opacity-0 focus:opacity-100"
                                        title="Delete Alert"
                                    >
                                        <span className="md:hidden text-sm font-semibold">Delete</span>
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AlertManager;
