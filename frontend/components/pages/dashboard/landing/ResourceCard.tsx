"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ResourceItem } from './types';

interface ResourceCardProps {
    resource: ResourceItem;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
    if (!resource.link) {
        return null;
    }

    return (
        <Link href={resource.link} className="block">
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <div className="mr-4 p-2 bg-muted rounded-full">
                            {resource.icon}
                        </div>
                        <div>
                            <h3 className="font-medium text-card-foreground">{resource.title}</h3>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}; 