from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Message


# @csrf_exempt
# def process_message(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             message = data.get('message', '')

#             # Process the message (simple echo example)
#             response_message = f"Server received: {message}"

#             return JsonResponse({'response': response_message})
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#     return JsonResponse({'error': 'Invalid method'}, status=405)



@csrf_exempt
def process_message(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message_content = data.get('message', '')

            # Save the message to the database
            message = Message(content=message_content)
            message.save()

            # Respond back to the Chrome extension
            response_message = f"Server received: {message_content}"
            return JsonResponse({'response': response_message})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Invalid method'}, status=405)



def message_list(request):
    messages = Message.objects.all().order_by('-created_at')
    return render(request, 'messages.html', {'messages': messages})