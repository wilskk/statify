// app/dashboard/loading.tsx
import { FolderOpen, FilePlus, Upload, Database, History, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLoading() {
    const dataActionSkeletons = Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="block h-full">
            <Card className="h-full border border-[#E6E6E6] shadow-sm bg-white animate-pulse">
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    <div className="p-4 rounded-full mb-4 bg-[#F7F7F7]">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                </CardContent>
            </Card>
        </div>
    ));

    const recentProjectSkeletons = Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="block">
            <Card className="bg-white border border-[#E6E6E6] shadow-sm animate-pulse">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="h-5 bg-gray-200 rounded w-36 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    ));

    const resourceSkeletons = Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="block">
            <Card className="bg-white border border-[#E6E6E6] shadow-sm animate-pulse">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="mr-4 p-2 bg-[#F7F7F7] rounded-full">
                            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div>
                            <div className="h-5 bg-gray-200 rounded w-28 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    ));

    return (
        <div className="min-h-screen bg-[#F7F7F7]">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="mb-12">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                </div>

                {/* Data Action Card Skeletons */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {dataActionSkeletons}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Recent Projects Section */}
                    <div className="md:col-span-2">
                        <div className="mb-6 flex justify-between items-center">
                            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            {recentProjectSkeletons}
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div>
                        <div className="mb-6">
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            {resourceSkeletons}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}