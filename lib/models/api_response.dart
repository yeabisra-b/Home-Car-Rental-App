class ApiResponse<T> {
  final T? data;
  final String? error;
  final List<ApiErrorDetail>? errors;
  final bool isSuccess;

  ApiResponse({
    this.data,
    this.error,
    this.errors,
    this.isSuccess = true,
  });

  factory ApiResponse.success(T data) {
    return ApiResponse(
      data: data,
      isSuccess: true,
    );
  }

  factory ApiResponse.error(String error, {List<ApiErrorDetail>? errors}) {
    return ApiResponse(
      error: error,
      errors: errors,
      isSuccess: false,
    );
  }

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    if (json.containsKey('error')) {
      return ApiResponse.error(
        json['error'] as String,
        errors: json['errors'] != null
            ? (json['errors'] as List)
                .map((e) => ApiErrorDetail.fromJson(e))
                .toList()
            : null,
      );
    }
    
    // Check if the json has a data key (like in pagination) or wrapped objects
    // The parsing function `fromJsonT` should be able to extract the specific envelope.
    return ApiResponse.success(fromJsonT(json));
  }
}

class ApiErrorDetail {
  final String field;
  final String message;

  ApiErrorDetail({required this.field, required this.message});

  factory ApiErrorDetail.fromJson(Map<String, dynamic> json) {
    return ApiErrorDetail(
      field: json['field'] ?? '',
      message: json['message'] ?? '',
    );
  }
}
