'use client';

import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MapReport {
  id: string;
  lat: number;
  lng: number;
  eventType: string;
  description: string;
  status: 'new' | 'verified' | 'investigating' | 'resolved';
  createdAt: Date;
  userId: string;
  photoUrl?: string;
  trustLevel: number; // For heat map intensity
}

// Fetch reports from Firebase for the map
export async function fetchMapReports(): Promise<MapReport[]> {
  try {
    const reportsCollection = collection(db, 'reports');
    const reportsQuery = query(reportsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(reportsQuery);
    
    const reports: MapReport[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        eventType: data.eventType || 'other',
        description: data.description || '',
        status: data.status || 'new',
        createdAt: data.createdAt?.toDate() || new Date(),
        userId: data.userId || '',
        photoUrl: data.photoUrl || '',
        trustLevel: calculateTrustLevel(data.status, data.createdAt),
      });
    });
    
    return reports;
  } catch (error) {
    console.error('Error fetching map reports:', error);
    return [];
  }
}

// Subscribe to real-time reports updates
export function subscribeToMapReports(callback: (reports: MapReport[]) => void) {
  const reportsCollection = collection(db, 'reports');
  const reportsQuery = query(reportsCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(reportsQuery, (querySnapshot) => {
    const reports: MapReport[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        eventType: data.eventType || 'other',
        description: data.description || '',
        status: data.status || 'new',
        createdAt: data.createdAt?.toDate() || new Date(),
        userId: data.userId || '',
        photoUrl: data.photoUrl || '',
        trustLevel: calculateTrustLevel(data.status, data.createdAt),
      });
    });
    
    callback(reports);
  });
}

// Calculate trust level based on status and time
function calculateTrustLevel(status: string, createdAt: any): number {
  let baseScore = 50; // Default trust level
  
  // Adjust based on status
  switch (status) {
    case 'verified':
      baseScore = 90;
      break;
    case 'investigating':
      baseScore = 70;
      break;
    case 'resolved':
      baseScore = 85;
      break;
    case 'new':
      baseScore = 50;
      break;
  }
  
  // Adjust based on recency (more recent = higher trust for verified reports)
  if (createdAt && status === 'verified') {
    const now = new Date();
    const reportTime = createdAt.toDate ? createdAt.toDate() : createdAt;
    const hoursSinceReport = (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60);
    
    // Boost trust for recent verified reports
    if (hoursSinceReport < 6) {
      baseScore = Math.min(100, baseScore + 10);
    }
  }
  
  return baseScore;
}

// Update report status (for officials)
export async function updateReportStatus(reportId: string, newStatus: 'new' | 'verified' | 'investigating' | 'resolved') {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: newStatus,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
