import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Bell, Calendar, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await axiosClient.get('/alerts');
                if (response.data?.success) {
                    setAlerts(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Bell className="w-6 h-6 text-orange-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Announcements</h1>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 uppercase">
                        {alerts.length} Posts
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">Fetching latest updates...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Announcements</h2>
                        <p className="text-gray-500">Everything looks quiet for now. Check back later for important updates.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {alerts.map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                        <Bell className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-800 text-lg font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                                            {alert.content}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-t border-gray-50 pt-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(alert.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{alert.users ? `${alert.users.first_name} ${alert.users.last_name} (admin)` : 'Academic Admin'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
};

export default AlertsPage;
