'use client';

import { useParams } from 'react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, DollarSign, User, Shield, Hash, Download, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PolicyJsonEditorDialog } from './policy-json-editor-dialog';

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

const statusStyles: Record<string, string> = {
    Active: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    Cancelled: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    Deleted: 'border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
    Expired: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    Pending: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    Void: 'border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400',
};

const policyStatusStyles: Record<string, string> = {
    Draft: 'border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400',
    'Pending documents': 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    Completed: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
};

const PolicyDetailsPage = () => {
    const { policyId } = useParams<{ policyId: string }>();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorContactId, setEditorContactId] = useState<number | null>(null);

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
    const uploadedFilesCount = filesData?.count ?? 0;

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (fileId: string) => {
        if (downloadingId) return;
        setDownloadingId(fileId);
        try {
            const { url } = await apiClient.getFileDownloadUrl(policyId!, fileId);
            const a = document.createElement('a');
            a.href = url;
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleOpenEditor = (contactId: number | null) => {
        if (!contactId) return;
        setEditorContactId(contactId);
        setEditorOpen(true);
    };

    const policyStatusLabel = (() => {
        if (!policyInfo || filesLoading) return null;

        if (policyInfo.application_is_processed === true) return 'Completed';
        if (uploadedFilesCount === 0) return 'Draft';
        return 'Pending documents';
    })();

    return (
        <div className="container mx-auto space-y-6">
            {/* Policy Summary Card — 40% height */}
            <Card className="min-h-[40vh]">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl">Policy Details</CardTitle>
                            {policyInfo?.status && (
                                <Badge
                                    variant="outline"
                                    className={`text-sm px-3 py-1 ${statusStyles[policyInfo.status] || ''}`}
                                >
                                    {policyInfo.status}
                                </Badge>
                            )}
                        </div>
                        {policyStatusLabel && (
                            <Badge
                                variant="outline"
                                className={`text-sm px-3 py-1 ml-auto ${policyStatusStyles[policyStatusLabel] || ''}`}
                            >
                                {policyStatusLabel}
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
                                value={policyInfo.producer || '-'}
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
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">File ID</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Created</th>
                                                <th className="py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filesData.data.map((file) => (
                                                <tr key={file.file_id} className="border-b hover:bg-muted/40 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-xs">
                                                            {file.type_label || file.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                                                        {file.file_id || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatDate(file.created_on)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Download"
                                                                disabled={downloadingId === file.file_id}
                                                                onClick={() => handleDownload(file.file_id)}
                                                            >
                                                                <Download className={`size-4 ${downloadingId === file.file_id ? 'animate-pulse text-muted-foreground' : 'text-primary'}`} />
                                                            </Button>
                                                            {file.type === 'application' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Edit application data"
                                                                    disabled={!file.contact_id}
                                                                    onClick={() => handleOpenEditor(file.contact_id)}
                                                                >
                                                                    <Pencil className={`size-4 ${file.contact_id ? 'text-primary' : 'text-muted-foreground'}`} />
                                                                </Button>
                                                            )}
                                                        </div>
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

            {editorContactId && (
                <PolicyJsonEditorDialog
                    contactId={editorContactId}
                    open={editorOpen}
                    onOpenChange={(open) => {
                        setEditorOpen(open);
                        if (!open) {
                            setEditorContactId(null);
                        }
                    }}
                />
            )}
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
