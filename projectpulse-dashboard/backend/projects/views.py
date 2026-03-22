from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from datetime import date
from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Project.objects.filter(user=self.request.user)
        # Optional: filter by status query param
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Returns summary stats + time-prediction data.
        All computation is local Python — no external API calls.
        """
        projects = Project.objects.filter(user=request.user)
        today = date.today()

        total = projects.count()
        completed = projects.filter(status='done')
        in_progress = projects.filter(status='in_progress')
        todo = projects.filter(status='todo')
        on_hold = projects.filter(status='on_hold')

        # Overdue: not done AND due_date < today
        overdue = projects.filter(
            due_date__lt=today
        ).exclude(status='done')

        # ── Prediction Algorithm ─────────────────────────────────────────────
        # 1. Compute efficiency ratio from completed projects:
        #    efficiency = average(actual_days / estimated_days) for done projects
        #    with both actual_days > 0 and estimated_days > 0
        completed_list = list(completed)
        efficiency_samples = [
            (p.actual_days / p.estimated_days)
            for p in completed_list
            if p.estimated_days > 0 and p.actual_days > 0
        ]
        avg_efficiency = (
            sum(efficiency_samples) / len(efficiency_samples)
            if efficiency_samples else 1.0
        )

        # 2. Average actual days for completed projects
        avg_actual_days_completed = (
            sum(p.actual_days for p in completed_list) / len(completed_list)
            if completed_list else 0
        )

        # 3. Per-project prediction for in-progress items
        in_progress_list = list(in_progress)
        in_progress_predictions = []
        for p in in_progress_list:
            if p.estimated_days > 0:
                # Predicted total = estimated * efficiency ratio
                predicted_total = round(p.estimated_days * avg_efficiency)
                remaining = max(0, predicted_total - p.days_elapsed)
            else:
                remaining = None
            in_progress_predictions.append({
                'id': str(p.id),
                'name': p.name,
                'priority': p.priority,
                'start_date': p.start_date,
                'due_date': p.due_date,
                'estimated_days': p.estimated_days,
                'days_elapsed': p.days_elapsed,
                'progress_pct': p.progress_pct,
                'predicted_remaining_days': remaining,
                'is_overdue': p.is_overdue,
            })

        # 4. Completed projects summary
        completed_summaries = [
            {
                'id': str(p.id),
                'name': p.name,
                'priority': p.priority,
                'start_date': p.start_date,
                'end_date': p.end_date,
                'estimated_days': p.estimated_days,
                'actual_days': p.actual_days,
                'on_time': p.actual_days <= p.estimated_days if p.estimated_days > 0 else None,
            }
            for p in completed_list
        ]

        return Response({
            'summary': {
                'total': total,
                'completed': completed.count(),
                'in_progress': in_progress.count(),
                'todo': todo.count(),
                'on_hold': on_hold.count(),
                'overdue': overdue.count(),
                'completion_rate_pct': round((completed.count() / total * 100) if total > 0 else 0, 1),
            },
            'prediction': {
                'avg_efficiency_ratio': round(avg_efficiency, 3),
                'avg_actual_days_completed': round(avg_actual_days_completed, 1),
                'sample_size': len(efficiency_samples),
                'note': (
                    'Based on historical velocity of completed projects. '
                    'No external API used.'
                ),
            },
            'completed_projects': completed_summaries,
            'in_progress_projects': in_progress_predictions,
        })
