'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
    apiClient,
    PolicyTemporaryJson,
    PolicyTemporaryJsonPrimitive,
    PolicyTemporaryJsonValue,
} from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type JsonPathSegment = string | number;

interface PolicyJsonEditorDialogProps {
    contactId?: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const toLabel = (value: string) =>
    value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const isObjectValue = (value: PolicyTemporaryJsonValue): value is PolicyTemporaryJson =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const isPrimitiveValue = (value: PolicyTemporaryJsonValue): value is PolicyTemporaryJsonPrimitive =>
    value === null || ['string', 'number', 'boolean'].includes(typeof value);

const toInputValue = (value: PolicyTemporaryJsonPrimitive) => {
    if (value === null) return '';
    return String(value);
};

const parseEditedPrimitive = (
    rawValue: string,
    originalValue: PolicyTemporaryJsonPrimitive
): PolicyTemporaryJsonPrimitive => {
    if (typeof originalValue === 'number') {
        if (rawValue.trim() === '') return '';
        const numericValue = Number(rawValue);
        return Number.isNaN(numericValue) ? rawValue : numericValue;
    }

    if (typeof originalValue === 'boolean') {
        if (rawValue.toLowerCase() === 'true') return true;
        if (rawValue.toLowerCase() === 'false') return false;
    }

    if (originalValue === null && rawValue.trim() === '') {
        return null;
    }

    return rawValue;
};

const updateValueAtPath = (
    source: PolicyTemporaryJsonValue,
    path: JsonPathSegment[],
    nextValue: PolicyTemporaryJsonValue
): PolicyTemporaryJsonValue => {
    if (path.length === 0) {
        return nextValue;
    }

    const [segment, ...rest] = path;

    if (Array.isArray(source)) {
        const nextArray = [...source];
        nextArray[segment as number] = updateValueAtPath(nextArray[segment as number], rest, nextValue);
        return nextArray;
    }

    return {
        ...source,
        [segment]: updateValueAtPath((source as PolicyTemporaryJson)[segment as string], rest, nextValue),
    };
};

interface JsonScalarFieldProps {
    label: string;
    value: PolicyTemporaryJsonPrimitive;
    onChange: (nextValue: PolicyTemporaryJsonPrimitive) => void;
}

function JsonScalarField({ label, value, onChange }: JsonScalarFieldProps) {
    const inputValue = toInputValue(value);
    const useTextarea = inputValue.length > 90 || inputValue.includes('\n');

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {label}
            </label>
            {useTextarea ? (
                <Textarea
                    value={inputValue}
                    onChange={(event) => onChange(parseEditedPrimitive(event.target.value, value))}
                    className="min-h-24"
                />
            ) : (
                <Input
                    value={inputValue}
                    onChange={(event) => onChange(parseEditedPrimitive(event.target.value, value))}
                />
            )}
        </div>
    );
}

interface JsonEditorNodeProps {
    label?: string;
    value: PolicyTemporaryJsonValue;
    path: JsonPathSegment[];
    depth?: number;
    onChange: (path: JsonPathSegment[], nextValue: PolicyTemporaryJsonValue) => void;
}

function JsonEditorNode({
    label,
    value,
    path,
    depth = 0,
    onChange,
}: JsonEditorNodeProps) {
    if (Array.isArray(value)) {
        return (
            <div className="space-y-3">
                {label && (
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                        <span className="text-xs text-muted-foreground">{value.length} items</span>
                    </div>
                )}
                {value.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Empty list
                    </div>
                ) : (
                    value.map((item, index) => (
                        <div
                            key={`${path.join('.')}-${index}`}
                            className="rounded-xl border border-border/70 bg-background px-4 py-4"
                        >
                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Item {index + 1}
                            </div>
                            <JsonEditorNode
                                value={item}
                                path={[...path, index]}
                                depth={depth + 1}
                                onChange={onChange}
                            />
                        </div>
                    ))
                )}
            </div>
        );
    }

    if (isObjectValue(value)) {
        const entries = Object.entries(value);
        return (
            <div className="space-y-4">
                {label && depth > 0 && (
                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                    {entries.map(([entryKey, entryValue]) => {
                        const nextPath = [...path, entryKey];
                        const entryLabel = toLabel(entryKey);
                        const nestedValue = isObjectValue(entryValue) || Array.isArray(entryValue);

                        if (nestedValue) {
                            return (
                                <div
                                    key={nextPath.join('.')}
                                    className="md:col-span-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4"
                                >
                                    <JsonEditorNode
                                        label={entryLabel}
                                        value={entryValue}
                                        path={nextPath}
                                        depth={depth + 1}
                                        onChange={onChange}
                                    />
                                </div>
                            );
                        }

                        return (
                            <JsonScalarField
                                key={nextPath.join('.')}
                                label={entryLabel}
                                value={entryValue}
                                onChange={(nextValue) => onChange(nextPath, nextValue)}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    if (!isPrimitiveValue(value)) {
        return null;
    }

    return (
        <JsonScalarField
            label={label || 'Value'}
            value={value}
            onChange={(nextValue) => onChange(path, nextValue)}
        />
    );
}

export function PolicyJsonEditorDialog({
    contactId,
    open,
    onOpenChange,
}: PolicyJsonEditorDialogProps) {
    const queryClient = useQueryClient();
    const [draftJson, setDraftJson] = useState<PolicyTemporaryJson | null>(null);

    const {
        data: temporaryJsonResponse,
        isLoading,
        isFetching,
        error,
    } = useQuery({
        queryKey: ['contact-application-data', contactId],
        queryFn: () => apiClient.getContactApplicationData(contactId!),
        enabled: open && Boolean(contactId),
        retry: false,
    });

    useEffect(() => {
        if (temporaryJsonResponse?.data && open) {
            setDraftJson(cloneJson(temporaryJsonResponse.data));
        }
    }, [open, temporaryJsonResponse]);

    const saveMutation = useMutation({
        mutationFn: (nextJson: PolicyTemporaryJson) => apiClient.saveContactApplicationData(contactId!, nextJson),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contact-application-data', contactId] });
            toast.success('Application data updated successfully');
            onOpenChange(false);
        },
        onError: (mutationError) => {
            const message = mutationError instanceof Error ? mutationError.message : 'Unable to save application data';
            toast.error(message);
        },
    });

    const handleValueChange = (path: JsonPathSegment[], nextValue: PolicyTemporaryJsonValue) => {
        setDraftJson((currentValue) => {
            if (!currentValue) {
                return currentValue;
            }

            return updateValueAtPath(currentValue, path, nextValue) as PolicyTemporaryJson;
        });
    };

    const handleCancel = () => {
        if (temporaryJsonResponse?.data) {
            setDraftJson(cloneJson(temporaryJsonResponse.data));
        }
        onOpenChange(false);
    };

    const handleSave = () => {
        if (!draftJson) {
            toast.error('No application data available to save');
            return;
        }

        saveMutation.mutate(draftJson);
    };

    const errorMessage = error instanceof Error ? error.message : 'Unable to load application data';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(96vw,1100px)] max-w-[1100px] max-h-[88vh] p-0">
                <DialogHeader className="border-b px-6 py-5 mb-0">
                    <DialogTitle>Edit Application Data</DialogTitle>
                    <DialogDescription>
                        {contactId
                            ? `Contact ID ${contactId}. Edit the extracted application data and save to update the record.`
                            : 'Edit the extracted application data and save to update the record.'}
                    </DialogDescription>
                </DialogHeader>

                <DialogBody className="overflow-y-auto px-6 py-5">
                    {isLoading || isFetching ? (
                        <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading application data...
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : draftJson ? (
                        <div className="space-y-5">
                            {Object.entries(draftJson).map(([sectionKey, sectionValue]) => (
                                <section
                                    key={sectionKey}
                                    className="rounded-2xl border border-border/70 bg-card px-5 py-5 shadow-sm"
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3">
                                        <h3 className="text-base font-semibold text-foreground">
                                            {toLabel(sectionKey)}
                                        </h3>
                                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            {Array.isArray(sectionValue)
                                                ? 'List'
                                                : isObjectValue(sectionValue)
                                                    ? 'Section'
                                                    : 'Value'}
                                        </span>
                                    </div>
                                    <JsonEditorNode
                                        value={sectionValue}
                                        path={[sectionKey]}
                                        onChange={handleValueChange}
                                    />
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-muted-foreground">
                            No application data found for this contact.
                        </div>
                    )}
                </DialogBody>

                <DialogFooter className="border-t px-6 py-4 mt-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saveMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!draftJson || saveMutation.isPending}
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 size-4" />
                        )}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}