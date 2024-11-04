export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Could not create shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Could not compile shader: ${info}`)
  }
  return shader
}

export function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
      }
      return program
    }

export function createCircleVertices(cx: number, cy: number, radius: number, numSegments: number) {
  const vertices = [cx + radius, cy]
  for (let i = 0; i <= numSegments; i++) {
    const angle = (i / numSegments) * 2 * Math.PI
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    vertices.push(x, y)
  }
  return new Float32Array(vertices)
}

export function initWebGL(gl: WebGLRenderingContext) {
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_direction; // Dirección para el grosor
uniform float u_thickness;
    uniform vec2 u_resolution;

    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
  `

  const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
  `

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!


  const program = createProgram(gl, vertexShader, fragmentShader)!
  gl.program = program
}

export function drawShaders(gl: WebGLRenderingContext, positions: Float32Array, color: GLfloat[], numSegments: number = 0, mode: GLenum = gl.LINE_LOOP) {
  if(!gl.program) return
  const { program } = gl

  const positionLocation = gl.getAttribLocation(program, "a_position")
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
  const colorLocation = gl.getUniformLocation(program, "u_color")

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.useProgram(program)

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
  gl.uniform4f(colorLocation, color[0], color[1], color[2], 1)

  gl.enableVertexAttribArray(positionLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.lineWidth(4)
  gl.drawArrays(mode, 0, numSegments + 2)
}