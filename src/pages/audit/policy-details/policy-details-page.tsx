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

const PolicyDetailsPage = () => {
    const { policyId } = useParams<{ policyId: string }>();

    const { data: filesData, isLoading: filesLoading } = useQuery({
        queryKey: ['policy-files', policyId],
        queryFn: () => apiClient.getPolicyFiles(policyId!),
        enabled: !!policyId,
    });

    // Dummy policy info for now — will be replaced with backend data later.
    const policyInfo = {
        policy_number: 'POL-2025-00421',
        insured_name: 'John A. Smith',
        carrier: 'National General Insurance',
        effective_date: '2025-06-01',
        exp_date: '2026-06-01',
        premium: 2450.0,
        csr: 'Maria Lopez',
        status: 'Active',
        binder_date: '2025-05-15',
        lob: 'Personal Auto',
    };

    return (
        <div className="container mx-auto space-y-6">
            {/* Policy Summary Card — 40% height */}
            <Card className="min-h-[40vh]">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Policy Details</CardTitle>
                        <Badge variant="outline" className="text-sm">
                            {policyInfo.status}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoItem
                            icon={<Hash className="size-4 text-primary" />}
                            label="Policy Number"
                            value={policyInfo.policy_number}
                        />
                        <InfoItem
                            icon={<User className="size-4 text-primary" />}
                            label="Insured Name"
                            value={policyInfo.insured_name}
                        />
                        <InfoItem
                            icon={<Shield className="size-4 text-primary" />}
                            label="Carrier"
                            value={policyInfo.carrier}
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
                        <InfoItem
                            icon={<User className="size-4 text-primary" />}
                            label="CSR"
                            value={policyInfo.csr}
                        />
                        <InfoItem
                            icon={<Calendar className="size-4 text-primary" />}
                            label="Binder Date"
                            value={formatDate(policyInfo.binder_date)}
                        />
                        <InfoItem
                            icon={<FileText className="size-4 text-primary" />}
                            label="Line of Business"
                            value={policyInfo.lob}
                        />
                    </div>
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
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Category</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Size</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Created</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Description</th>
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
                                                            {file.category || 'Uncategorized'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {file.content_type_final || file.content_type_reported || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatFileSize(file.size_final_bytes)}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatDate(file.created_on)}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                                                        {file.description || '-'}
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
