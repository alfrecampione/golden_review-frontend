'use client';

import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, DollarSign, User, Shield, Hash } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
};

const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusStyles: Record<string, string> = {
    Active: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    Cancelled: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    Deleted: 'border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
    Expired: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    Pending: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    Void: 'border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400',
};

const PolicyDetailsPage = () => {
    const { policyId } = useParams<{ policyId: string }>();

    const { data: policyData, isLoading: policyLoading } = useQuery({
        queryKey: ['policy-details', policyId],
        queryFn: () => apiClient.getPolicyDetails(policyId!),
        enabled: !!policyId,
    });

    const { data: filesData, isLoading: filesLoading } = useQuery({
        queryKey: ['policy-files', policyId],
        queryFn: () => apiClient.getPolicyFiles(policyId!),
        enabled: !!policyId,
    });

    const policyInfo = policyData?.data;

    return (
        <div className="container mx-auto space-y-6">
            {/* Policy Summary Card — 40% height */}
            <Card className="min-h-[40vh]">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-2xl">Policy Details</CardTitle>
                        {policyInfo?.status && (
                            <Badge variant="outline" className={`text-sm px-3 py-1 ${statusStyles[policyInfo.status] || ''}`}>
                                {policyInfo.status}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {policyLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : policyInfo ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Row 1 */}
                            <InfoItem
                                icon={<Hash className="size-4 text-primary" />}
                                label="Policy Number"
                                value={policyInfo.policy_number || '-'}
                            />
                            <InfoItem
                                icon={<User className="size-4 text-primary" />}
                                label="Insured Name"
                                value={policyInfo.insured_name || '-'}
                            />
                            <InfoItem
                                icon={<Shield className="size-4 text-primary" />}
                                label="Carrier"
                                value={policyInfo.carrier || '-'}
                            />
                            <InfoItem
                                icon={<User className="size-4 text-primary" />}
                                label="Producer"
                                value="-"
                            />
                            {/* Row 2 */}
                            <InfoItem
                                icon={<Calendar className="size-4 text-primary" />}
                                label="Binder Date"
                                value={formatDate(policyInfo.binder_date)}
                            />
                            <InfoItem
                                icon={<Calendar className="size-4 text-primary" />}
                                label="Effective Date"
                                value={formatDate(policyInfo.effective_date)}
                            />
                            <InfoItem
                                icon={<Calendar className="size-4 text-primary" />}
                                label="Expiration Date"
                                value={formatDate(policyInfo.exp_date)}
                            />
                            <InfoItem
                                icon={<DollarSign className="size-4 text-primary" />}
                                label="Premium"
                                value={formatCurrency(policyInfo.premium)}
                            />
                            {/* Row 3 */}
                            <InfoItem
                                icon={<User className="size-4 text-primary" />}
                                label="CSR"
                                value={policyInfo.csr || '-'}
                            />
                            <InfoItem
                                icon={<FileText className="size-4 text-primary" />}
                                label="Line of Business"
                                value={policyInfo.lob || '-'}
                            />
                            <InfoItem
                                icon={<FileText className="size-4 text-primary" />}
                                label="Business Type"
                                value={policyInfo.business_type || '-'}
                            />
                            <InfoItem
                                icon={<Shield className="size-4 text-primary" />}
                                label="MGA"
                                value={policyInfo.mga || '-'}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-muted-foreground">Policy not found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="files" className="w-full">
                <TabsList variant="line">
                    <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>

                <TabsContent value="files" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Contact Files
                                {filesData && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({filesData.count} files)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filesLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : filesData?.data && filesData.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="py-3 px-4 font-medium text-muted-foreground">File Name</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Size</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filesData.data.map((file) => (
                                                <tr key={file.file_id} className="border-b hover:bg-muted/40 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="size-4 text-muted-foreground shrink-0" />
                                                            <span className="font-medium truncate max-w-[300px]">
                                                                {file.file_name_reported || `File ${file.file_id}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-xs">
                                                            {file.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatFileSize(file.size_final_bytes)}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatDate(file.created_on)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <p className="text-muted-foreground">No files found for this policy</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const InfoItem = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-primary/10 p-2">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    </div>
);

export { PolicyDetailsPage };
